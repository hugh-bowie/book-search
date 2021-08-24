const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
	Query: {
		me: async (parent, args, context) => {
			if (context.user) {
				const userData = await User.findOne({ _id: context.user._id });
				// .select('-__v -password')
				return userData;
			}
			throw new AuthenticationError('user must login');
		},
	},

	Mutation: {
		addUser: async (parent, args) => {
			const user = await User.create(args);
			const token = signToken(user);
			return {
				token,
				user,
			};
		},

		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email });

			if (!user) {
				throw new AuthenticationError('user does not exist');
			}

			const correctPassword = await user.isCorrectPassword(password);

			if (!correctPassword) {
				throw new AuthenticationError('wrong password');
			}

			const token = signToken(user);
			return {
				token,
				user,
			};
		},

		saveBook: async (parent, { bookData }, context) => {
			if (context.user) {
				const updatedUser = await User.findByIdAndUpdate({ _id: context.user._id }, { $push: { savedBooks: bookData } }, { new: true });
				return updatedUser;
			}

			throw new AuthenticationError('you need to be logged in');
		},

		removeBook: async (parent, { bookId }, context) => {
			if (context.user) {
				const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true });

				return updatedUser;
			}

			throw new AuthenticationError('you need to be logged in');
		},
	},
};

module.exports = resolvers;
