const express = require('express');
const viewController = require('../controllers/viewController');
const router = express.Router();
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours',authController.protect,viewController.getMyTours);

router.use(authController.isLoggedIn);

router.get('/',bookingController.createBookingCheckout, viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLoginForm);

module.exports = router;
