const mongoose = require('mongoose');
const slugify = require('slugify');

// const User = require('./userModel');
// const validator = require('validator');

//CONSTRUCTING A MONGOOSE SCHEMA
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'A name must be unique'],
      trim: true,
      maxlength: [40, 'A tour name must be less or equal than 40 characters'],
      minlength: [10, 'A tour name must be more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'A tour must only contains alphabets'],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
      maxlength: [100, 'A tour name must be less or equal than 40 characters'],
      minlength: [20, 'A tour name must be more or equal than 10 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
      min: 1,
      max: 15,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a price'],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (discountPrice) {
          //this only points to the current doc when NEW  document creation
          return discountPrice < this.price;
        },
        message: 'Discounted price cannot be greater than actual price',
      },
    },

    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],

    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// 1) DOCUMENT MIDDLEWARE PRE SAVE HOOK DOCUMENT MIDDLEWARE ONLY WORKS ON SAVE AND CREATE
//IT DOES NOT ON UPDATE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//2) QUERY MIDDLEWARE FIND() and FINDONE()

//2A) PRE FIND HOOK MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// 2B) POST FIND HOOK MIDDLEWARE
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Querying took ${Date.now() - this.start} milliseconds.`);
  next();
});

// 3) AGGREGATION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// CREATING A MODEL FROM THE "tourSchema" SCHEMA
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
