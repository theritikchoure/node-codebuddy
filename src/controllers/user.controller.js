const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    // Pagination parameters
    const pageSize = Number(req.query.limit) || 10; // Number of documents per page
    const currentPage = Number(req.query.page) || 1; // Current page number

    // Calculate skip value for pagination
    const skip = (currentPage - 1) * pageSize;

    // Retrieve users with post count
    const users = await User.aggregate([
      {
        $lookup: {
          from: "posts", // Collection name for posts
          localField: "_id", // User id field
          foreignField: "userId", // Post user id field
          as: "posts", // Array field to store posts
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          posts: { $size: "$posts" },
        },
      },
      { $skip: skip }, // Skip documents
      { $limit: pageSize }, // Limit documents
    ]);

    // Retrieve total document count for pagination
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = currentPage < totalPages;

    // Pagination object
    const pagination = {
      totalDocs: totalCount,
      limit: pageSize,
      page: currentPage,
      totalPages,
      pagingCounter: (currentPage - 1) * pageSize + 1,
      hasNextPage,
      hasPrevPage: currentPage > 1,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
      nextPage: hasNextPage ? currentPage + 1 : null,
    };

    // Response object
    const data = {
      data: {
        users,
        pagination,
      },
    };

    res.status(200).json(data);
  } catch (error) {
    res.send({ error: error.message });
  }
};
