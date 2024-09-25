const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel')

exports.getOverview = catchAsync(async (req, res) => {
  //1) getting all tours
  const tours = await Tour.find();

  //3) rendering and sending the tours
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'user rating review',
  });
  if (!tour) {
    throw new AppError('There is no such a tour with that name', 404);
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
    // user: res.locals.user,
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req,res,next)=>{
  // Getting all the tours related to the logged in user
  const bookings = await Booking.find({user:req.user.id});

  const tourIds = await bookings.map(el=>el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } })

  res.status(200).render('overview',{
    title:'Your bookings',
    tours
  })
})