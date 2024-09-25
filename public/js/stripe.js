import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51Q2GQdP2dqphUs2ANZcH9ykueQWJjhNyWiKOAJEcoFLCsIQGYZtVeZtoBtliFU9DKtxavocoPQDtxG3NxL3ouXt100jw2yMDyL')

export const bookTour = async tourId=>{
	const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
	
	if(session.status === 200){
		await stripe.redirectToCheckout({
			sessionId:session.data.session.id
		})
	}
}