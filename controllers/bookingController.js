const Stripe = require('stripe');


const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Booking = require('../models/bookingModel')

exports.getCheckoutSession =catchAsync(async (req,res,next)=>{
	const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
	// 1) Get the currently booked tour
	const tour = await Tour.findById(req.params.tourId);
	
	const transformedData = [{
		quantity:1,
		price_data:{
			currency:'usd',
			unit_amount:tour.price * 100,
			product_data:{
				name:`${tour.name} Tour`,
				description: tour.summary,
				images:[`https://www.natours.dev/img/tours/${tour.imageCover}`],
			}
		},
		
	}]

	// 2) Create the checkout session
	const session = await stripe.checkout.sessions.create({
		payment_method_types :['card'],
		success_url :`${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${req.user.id}&price=${tour.price}`,
		cancel_url :`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
		customer_email:req.user.email,
		client_reference_id: tour.id,
		line_items: transformedData,
		mode: 'payment',
	})

	// 3) Send session as a responce
	res.status(200).json({
		states:'success',
		session
	})
});

exports.createBookingCheckout = catchAsync(async(req,res,next)=>{
	const {tour, user, price} = req.query;

	if(!tour || !user || !price) return next();
	await Booking.create({tour,user,price});

	res.redirect(req.originalUrl.split('?')[0]);
})

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.updateBooking = factory.updateOne(Booking);