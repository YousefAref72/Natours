const mongoose = require('mongoose');
const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review can NOT be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'The rate must be above 1.0'],
      max: [5, 'The rate must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a tour'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a user'],
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0] ? stats[0].avgRating : 0,
    ratingsQuantity: stats[0] ? stats[0].nRatings : 4.5,
  });
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.trans = await findOne();
//   next();
// });
// reviewSchema.post('save', function () {
//   this.constructor.calcAverageRatings(this.tour);
// });

//better way
reviewSchema.post(/save|^findOne/, async function (docs, next) {
  // this.trans.constructor.calcAverageRatings(this.trans.tour);
  //instead
  if (docs) await docs.constructor.calcAverageRatings(docs.tour);
  next();
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
