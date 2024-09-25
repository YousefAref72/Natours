const multer = require('multer');
const sharp = require('sharp');

const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

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

exports.uploadTourImages = upload.fields([
  {name:'imageCover',maxCount:3},
  {name:'images',maxCount:3}
])

exports.resizeTourImages =catchAsync(async (req,res,next)=>{
  if(!req.files.imageCover || !req.files.images)return next();
  
  // ImageCover processing 
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').toFile(`public/img/tours/${req.body.imageCover}`)
  
  // tour images processing
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file,i)=>{
      const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`
      await sharp(file.buffer)
      .resize(2000,1333).toFormat('jpeg').toFile(`public/img/tours/${filename}`)
      req.body.images.push(filename);
    })
  )
  next();
})

exports.alias = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id:null,
        _id: '$difficulty', // grouping according to difficulty
        numTours: { $sum: 1 }, //getting accumlated by adding 1
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPricing: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgRating: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'successful',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarted: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $sort: {
        numToursStarted: -1,
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: false, // or 0
      },
    },
  ]);
  res.status(200).json({
    status: 'successful',
    data: {
      plan,
    },
  });
});

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    throw new AppError('Please enter a valid latitude and langtude', 400);
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    states: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    throw new AppError('Please enter a valid latitude and langtude', 400);
  }
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    states: 'success',
    data: {
      data: distance,
    },
  });
});
