class ApiFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword
            ? {
                name: {
                    $regex: this.queryStr.keyword, //all position check
                    $options: 'i' //casein sensitive
                }
            } : {};

        // console.log(keyword)

        this.query = this.query.find({ ...keyword })
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryStr };
        const removeField = ["keyword", "page", "limit"];

        removeField.forEach((key) => delete queryCopy[key]);

        // Filter for price and rating

        // console.log(queryCopy);

        let querystr = JSON.stringify(queryCopy);
        querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`)
        this.query = this.query.find(JSON.parse(querystr))

        // console.log(querystr)
        return this;
    }

    pagination(resultPerPage) { //5, 2
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultPerPage * (currentPage - 1)
        this.query = this.query.limit(resultPerPage).skip(skip)
        return this;
    }


}

module.exports = ApiFeatures;