const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

process.on('uncaughtException',err=>{
  console.log(err.name,err.message);
  process.exit(1);
})

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(console.log('connected to the DB successfully!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('listening....');
});

process.on('unhandledRejection',err=>{
  console.log(err.name,err.message);
  server.close(()=>{
    process.exit(1);
  })
})
