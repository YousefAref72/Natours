const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('./../utils/emails');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIR,
  });

const createSendToken = function (user, statusCode, res) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    states: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  // const newUser =await User.create(req.body);
  const newUser = await User.create({
    // in order to prevent the user from inserting unwanted data(more safe)
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser,url).sendWelcome();
  createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // if email and password exist
  const { email, password } = req.body;
  if (!email || !password)
    throw new AppError('Please provide both email and password', 404);
  // if the user matchs the password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password)))
    throw new AppError('Incorrect email or password', 401);

  // if valid, send the token
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000), //expires so quickly
    httpOnly: true,
  });

  res.status(200).json({ states: 'success' });
});
exports.protect = catchAsync(async (req, res, next) => {
  // getting the token from the clien side
  let token;
  //   console.log(req.headers);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    throw new AppError(
      'You are not logged in! Please log in to get access.',
      401,
    ); //401 stands for bad authntication

  // verifing that the token is valid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // checking if the user still exist
  const fresherUser = await User.findById(decoded.id);
  if (!fresherUser)
    throw new AppError(
      'The user that belongs to this token does no longer exit!',
      401,
    );

  if (fresherUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      'The password got changed and the token is not valid anymore.',
    );
  }
  req.user = fresherUser;
  res.locals.user = fresherUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    // Getting the token from the clien side
    if (!req.cookies.jwt) return next();

    // verifing that the token is valid
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    // checking if the user still exist
    const fresherUser = await User.findById(decoded.id);
    if (!fresherUser) return next();

    // checking if the user changed his password
    if (fresherUser.changedPasswordAfter(decoded.iat)) return next();

    // The user is finally logged in
    res.locals.user = fresherUser;
    next();
  } catch (err) {
    next();
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You don't have the permission to perform this action",
        403,
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the POSTed email

  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError("There's no user for this email");

  //generating the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateModifiedOnly: true });
  
  //sending an email to the user
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
    console.log(user);
    await new Email(user,resetURL).sendResetPassword()

    res.status(200).json({
      states: 'success',
      message: 'the token is sent via mail!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });
    throw new AppError("Couldn't send the reset password email.", 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError('The token is not valid or has expired.', 400); //bad request

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //updating the passwordChangedAt property using a document middleware
  // if valid, send the token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user
  const user = await User.findById(req.user.id).select('+password');
  //2) check if the password matchs

  if (
    !user ||
    !user.correctPassword(req.body.currentPassword, req.body.password)
  )
    throw new AppError(
      'The password is not correct, please try again with the correct password.',
      400,
    );

  //3) if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log the user in
  createSendToken(user, 200, res);
});
