npm install stripe@^15.0.0

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
apiVersion: "2024-04-10",
})
