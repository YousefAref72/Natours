const multer = require('multer');
const sharp = require('sharp');

const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//Multer config
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();//saving it to the memory 

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto =catchAsync(async (req,res,next)=>{
  if(!req.file) return next();
  req.file.filename =  `user-${req.user.id}-${Date.now()}.jpeg`
  await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').toFile(`public/img/users/${req.file.filename}`)
  next();
})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((ele) => {
    if (allowedFields.includes(ele)) newObj[ele] = obj[ele];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res) => {

  // if the password is included in the updated data, throw an error
  if (req.body.password || req.body.passwordConfirm) {
    throw new AppError(
      'This route is not supposed to update your password!',
      400,
    );
  }

  //filtering out any unwanted data
  const filteredObj = filterObj(req.body, 'name', 'email');
  if(req.file) filteredObj.photo = req.file.filename;
  //
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    states: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  //setting the active propery to false NOT actualy deleting the user
  await User.findByIdAndUpdate(req.user.id, { active: false });
  //preventing the falsy active users from showing up using a query middleware
  res.status(204).end();
});
exports.createUser = function (req, res) {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined yet!',
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
