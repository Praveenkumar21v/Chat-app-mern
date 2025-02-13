import React, { useCallback, useEffect, useState } from "react";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import Avatar from "./Avatar";
import { useDispatch, useSelector } from "react-redux";
import EditUserDetails from "./EditUserDetails";
import { FiArrowUpLeft } from "react-icons/fi";
import SearchUser from "./SearchUser";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import { logout } from "../redux/userSlice";
import ConfirmationModal from "./ConfirmationModal";
import toast from "react-hot-toast";

const Sidebar = () => {
  const user = useSelector((state) => state?.user);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [allUser, setAllUser] = useState([]);
  const [openSearchUser, setOpenSearchUser] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    userId: null,
  });

  const socketConnection = useSelector((state) => state.user.socketConnection);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const deletedUserIds = JSON.parse(localStorage.getItem("deletedUserIds")) || [];
  
    if (socketConnection) {
      socketConnection.emit("sidebar", user._id);
  
      socketConnection.on("conversation", (data) => {
        const conversationUserData = data.map((conversationUser) => {
          return {
            ...conversationUser,
            userDetails:
              conversationUser?.receiver?._id === user?._id
                ? conversationUser.sender
                : conversationUser.receiver,
          };
        });
  
        const filteredUsers = conversationUserData.filter(
          (convUser) =>
            convUser.userDetails && !deletedUserIds.includes(convUser.userDetails._id)
        );
        setAllUser(filteredUsers);
      });
  
      socketConnection.on("newMessage", (messageData) => {
        const senderId = messageData.senderId;
  
        if (deletedUserIds.includes(senderId)) {
          console.log(`Received message from deleted user: ${senderId}`);
  
          const updatedDeletedUserIds = deletedUserIds.filter((id) => id !== senderId);
          localStorage.setItem("deletedUserIds", JSON.stringify(updatedDeletedUserIds));
  
          setAllUser((prevUsers) => {
            const existingUserIndex = prevUsers.findIndex(
              (user) => user.userDetails._id === senderId
            );
  
            if (existingUserIndex !== -1) {
              const updatedUser = {
                ...prevUsers[existingUserIndex],
                lastMsg: messageData,
              };
              const updatedUsers = [...prevUsers];
              updatedUsers[existingUserIndex] = updatedUser;
              return updatedUsers;
            } else {
              return [
                ...prevUsers,
                {
                  userDetails: { _id: senderId, name: messageData.senderName }, // Ensure senderName is available
                  lastMsg: messageData,
                },
              ];
            }
          });
        } else {
          setAllUser((prevUsers) => {
            const userIndex = prevUsers.findIndex(
              (user) => user.userDetails._id === senderId
            );
            if (userIndex !== -1) {
              const updatedUser = {
                ...prevUsers[userIndex],
                lastMsg: messageData,
              };
              const updatedUsers = [...prevUsers];
              updatedUsers[userIndex] = updatedUser;
              return updatedUsers;
            } else {
              return prevUsers;
            }
          });
        }
      });
    }
  }, [socketConnection, user]);
  

  const handleUserClick = (userId) => {
    setSelectedUser(userId);
  };

  const handleLogout = () => {
    setIsModalOpen(true);
  };

  const handleConfirmLogout = () => {
    dispatch(logout());
    toast.success("Logout successful!");
    setIsModalOpen(false);
    setTimeout(() => {
      navigate("/email");
      localStorage.clear();
    }, 3000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleContextMenu = (e, userId) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, userId });
  };

  const handleDeleteUser = () => {
    if (contextMenu.userId) {
      const deletedUserIds =
        JSON.parse(localStorage.getItem("deletedUserIds")) || [];
      deletedUserIds.push(contextMenu.userId);
      localStorage.setItem("deletedUserIds", JSON.stringify(deletedUserIds));

      setAllUser((prev) =>
        prev.filter((user) => user.userDetails?._id !== contextMenu.userId)
      );
      setContextMenu({ ...contextMenu, visible: false });
      toast.success("User removed!");

      if (selectedUser === contextMenu.userId) {
        setSelectedUser (null);
        navigate("/"); 
      }
    } else {
      console.error("No user ID found for deletion.");
    }
  };

  const handleClickOutside = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [setContextMenu]);

  useEffect(() => {
    if (contextMenu.visible) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible, handleClickOutside]);

  return (
    <div className="w-full h-full grid grid-cols-[48px,1fr] bg-white">
      <div className="bg-slate-100 w-12 h-full rounded-tr-lg rounded-br-lg py-5 text-slate-600 flex flex-col justify-between">
        <div>
          <NavLink
            className={({ isActive }) =>
              `w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded ${
                isActive && "bg-slate-200"
              }`
            }
            title="chat"
          >
            <IoChatbubbleEllipses size={20} />
          </NavLink>

          <div
            title="add friend"
            onClick={() => setOpenSearchUser(true)}
            className="w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded"
          >
            <FaUserPlus size={20} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <button
            className="mx-auto"
            title={user?.name}
            onClick={() => setEditUserOpen(true)}
          >
            <Avatar
              width={40}
              height={40}
              name={user?.name}
              imageUrl={user?.profile_pic}
              userId={user?._id}
            />
          </button>
          <button
            title="logout"
            className="w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded"
            onClick={handleLogout}
          >
            <span className="-ml-2">
              <BiLogOut size={20} />
            </span>
          </button>
        </div>
      </div>

      <div className="w-full">
        <div className="h-16 flex items-center">
          <h2 className="text-xl font-bold p-4 text-slate-800">Message</h2>
        </div>
        <div className="bg-slate-200 p-[0.5px]"></div>

        <div className=" h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar">
          {allUser.length === 0 && (
            <div className="mt-12">
              <div className="flex justify-center items-center my-4 text-slate-500">
                <FiArrowUpLeft size={50} />
              </div>
              <p className="text-lg text-center text-slate-400">
                Explore users to start a conversation with.
              </p>
            </div>
          )}

          {allUser.map((conv) => {
            const isSelected = selectedUser === conv?.userDetails?._id;

            return (
              <NavLink
                to={"/" + conv?.userDetails?._id}
                key={conv?._id}
                onClick={() => handleUserClick(conv?.userDetails?._id)}
                onContextMenu={(e) =>
                  handleContextMenu(e, conv?.userDetails?._id)
                }
                className={`flex items-center gap-2 py-3 px-2 border border-transparent rounded cursor-pointer 
                    hover:bg-slate-100 hover:border-primary 
                    ${isSelected ? "bg-slate-200 border-primary" : ""}`}
              >
                <div>
                  <Avatar
                    imageUrl={conv?.userDetails?.profile_pic}
                    name={conv?.userDetails?.name}
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <h3 className="text-ellipsis line-clamp-1 font-semibold text-base">
                    {conv?.userDetails?.name}
                  </h3>
                  <div className="text-slate-500 text-xs flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      {conv?.lastMsg?.imageUrl && (
                        <div className="flex items-center gap-1">
                          <span>
                            <FaImage />
                          </span>
                          {!conv?.lastMsg?.text && <span>Image</span>}
                        </div>
                      )}
                      {conv?.lastMsg?.videoUrl && (
                        <div className="flex items-center gap-1">
                          <span>
                            <FaVideo />
                          </span>
                          {!conv?.lastMsg?.text && <span>Video</span>}
                        </div>
                      )}
                    </div>
                    <p className="text-ellipsis line-clamp-1">
                      {conv?.lastMsg?.text}
                    </p>
                  </div>
                </div>
                {Boolean(conv?.unseenMsg) && (
                  <p className="text-xs w-6 h-6 flex justify-center items-center ml-auto p-1 bg-primary text-white font-semibold rounded-full">
                    {conv?.unseenMsg}
                  </p>
                )}
              </NavLink>
            );
          })}

          {contextMenu.visible && (
            <div
              className="absolute z-10 bg-white border rounded shadow-lg"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={handleDeleteUser}
                className="block px-4 py-2 text-left hover:bg-slate-200"
              >
                Delete User
              </button>
            </div>
          )}
        </div>
      </div>

      {editUserOpen && (
        <EditUserDetails onClose={() => setEditUserOpen(false)} user={user} />
      )}

      {openSearchUser && (
        <SearchUser onClose={() => setOpenSearchUser(false)} />
      )}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};

export default Sidebar;
