class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((ex) => delete queryObj[ex]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`),
    );
    this.query = this.query.find(queryStr); // filtering

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('-createdAt');

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const field = this.queryString.fields
        .split(',')
        .join(' ')
        .replaceAll('password', '');
      this.query = this.query.select(field);
    } else this.query = this.query.select('-__v'); //excluding something that is used internally by mongoDB

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const toursPerPage = +this.queryString.limit || 100;
    const toBeSkipped = (page - 1) * toursPerPage;

    this.query = this.query.skip(toBeSkipped).limit(toursPerPage);

    return this;
  }
}

module.exports = APIFeatures;
