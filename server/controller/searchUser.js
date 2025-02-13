const UserModel = require('../models/UserModel');

async function searchUser(request, response) {
    try {
        console.log('Request Body:', request.body);

        const { search } = request.body;

        if (!search || search.trim() === '') {
            return response.status(400).json({
                message: 'Search term is required',
                error: true
            });
        }

        const query = new RegExp(search, "i");

        const users = await UserModel.find({
            "$or": [
                { name: query },
                { email: query }
            ]
        }).select('-password');

        if (users.length === 0) {
            return response.status(404).json({
                message: 'No users found matching the search criteria',
                error: true
            });
        }

        return response.json({
            message: 'Users found',
            data: users,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || 'An error occurred',
            error: true
        });
    }
}

module.exports = searchUser;
