class AppError extends Error {
    constructor(message,statesCode){
        super(message);

        this.statesCode = statesCode;
        this.states = String(statesCode).startsWith('4') ? 'fail':'error';
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor);
    }
}

module.exports = AppError;