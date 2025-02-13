const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");
const UserModel = require("../models/UserModel");
const {
  ConversationModel,
  MessageModel,
} = require("../models/ConversationModel");
const getConversation = require("../helpers/getConversation");

const app = express();
const server = http.createServer(app);
const cors = require("cors");

const allowedOrigins = ["http://localhost:8080"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.options("*", cors());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  const token = socket.handshake.auth.token;
  console.log("Received Token:", token);

  if (!token) {
    console.log("No token provided, disconnecting socket:", socket.id);
    socket.disconnect();
    return;
  }

  try {
    const user = await getUserDetailsFromToken(token);
    if (!user) {
      console.log("Invalid token, disconnecting socket:", socket.id);
      socket.disconnect();
      return;
    }

    console.log(`User authenticated: ${user._id}`);
    socket.join(user._id.toString());
    onlineUser.add(user._id.toString());

    io.emit("onlineUser", Array.from(onlineUser));

    socket.on("message-page", async (userId) => {
      console.log("Request for message page for userId:", userId);

      try {
        const userDetails = await UserModel.findById(userId).select(
          "-password"
        );
        const payload = {
          _id: userDetails._id,
          name: userDetails.name,
          email: userDetails.email,
          profile_pic: userDetails.profile_pic,
          online: onlineUser.has(userId),
        };
        socket.emit("message-user", payload);

        const conversation = await ConversationModel.findOne({
          $or: [
            { sender: user._id, receiver: userId },
            { sender: userId, receiver: user._id },
          ],
        })
          .populate("messages")
          .sort({ updatedAt: -1 });

        socket.emit("message", conversation?.messages || []);
      } catch (err) {
        console.error("Error handling message-page event:", err);
      }
    });

    socket.on("new message", async (data) => {
      console.log("New message data:", data);

      try {
        let conversation = await ConversationModel.findOne({
          $or: [
            { sender: data.sender, receiver: data.receiver },
            { sender: data.receiver, receiver: data.sender },
          ],
        });

        if (!conversation) {
          conversation = await new ConversationModel({
            sender: data.sender,
            receiver: data.receiver,
          }).save();
        }

        const message = new MessageModel({
          text: data.text,
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          msgByUserId: data.msgByUserId,
        });
        const savedMessage = await message.save();

        await ConversationModel.updateOne(
          { _id: conversation._id },
          {
            $push: { messages: savedMessage._id },
          }
        );

        const updatedConversation = await ConversationModel.findOne({
          $or: [
            { sender: data.sender, receiver: data.receiver },
            { sender: data.receiver, receiver: data.sender },
          ],
        })
          .populate("messages")
          .sort({ updatedAt: -1 });

        io.to(data.sender).emit("message", updatedConversation?.messages || []);
        io.to(data.receiver).emit(
          "message",
          updatedConversation?.messages || []
        );

        const conversationSender = await getConversation(data.sender);
        const conversationReceiver = await getConversation(data.receiver);

        io.to(data.sender).emit("conversation", conversationSender);
        io.to(data.receiver).emit("conversation", conversationReceiver);
      } catch (err) {
        console.error("Error handling new message event:", err);
      }
    });

    socket.on("sidebar", async (currentUserId) => {
      console.log("Sidebar request for userId:", currentUserId);
      try {
        const conversation = await getConversation(currentUserId);
        socket.emit("conversation", conversation);
      } catch (err) {
        console.error("Error handling sidebar event:", err);
      }
    });

    socket.on("seen", async (msgByUserId) => {
      console.log("Seen event for userId:", msgByUserId);

      try {
        const conversation = await ConversationModel.findOne({
          $or: [
            { sender: user._id, receiver: msgByUserId },
            { sender: msgByUserId, receiver: user._id },
          ],
        });

        const conversationMessageId = conversation?.messages || [];

        await MessageModel.updateMany(
          { _id: { $in: conversationMessageId }, msgByUserId: msgByUserId },
          { $set: { seen: true } }
        );

        const conversationSender = await getConversation(user._id.toString());
        const conversationReceiver = await getConversation(msgByUserId);

        io.to(user._id.toString()).emit("conversation", conversationSender);
        io.to(msgByUserId).emit("conversation", conversationReceiver);
      } catch (err) {
        console.error("Error handling seen event:", err);
      }
    });

    socket.on("disconnect", () => {
      if (user) {
        onlineUser.delete(user._id.toString());
        io.emit("onlineUser", Array.from(onlineUser));
      }
      console.log("User disconnected:", socket.id);
    });
  } catch (err) {
    console.error("Error handling connection:", err);
    socket.disconnect();
  }
});

module.exports = {
  app,
  server,
};
