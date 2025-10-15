import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiX } from "react-icons/fi";

import { NotificationType, StackedNotificationType } from "@/types/types";

export default function StackedNotification({ isNotifOpen, setIsNotifOpen, message }: StackedNotificationType) {
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string }>>([]);

  // Watch for changes to isNotifOpen and message to add new notifications
  useEffect(() => {
    if (isNotifOpen && message) {
      const newNotif = {
        id: Date.now().toString(),
        text: message,
      };
      setNotifications((prev) => [...prev, newNotif]);

      setIsNotifOpen(false);
    }
  }, [isNotifOpen, message, setIsNotifOpen]);

  const removeNotif = (id?: string) => {
    if (id) {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }
  };

  return (
    <div className="flex items-center justify-center">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification key={notification.id} id={notification.id} text={notification.text} removeNotif={removeNotif} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const NOTIFICATION_TTL = 5000;

const Notification = ({ text, id, removeNotif }: NotificationType) => {
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      removeNotif(id);
    }, NOTIFICATION_TTL);

    return () => clearTimeout(timeoutRef);
  }, [id, removeNotif]);

  return (
    <motion.div
      layout
      initial={{ y: 15, scale: 0.9, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ y: -25, scale: 0.9, opacity: 0 }}
      transition={{ type: "spring" }}
      className="p-4 w-80 flex items-start rounded-lg gap-2 text-sm font-medium shadow-lg text-white bg-violet-600 fixed z-50 bottom-4 right-4"
    >
      <FiAlertCircle className="text-3xl absolute -top-4 -left-4 p-2 rounded-full bg-white text-violet-600 shadow" />
      <span>{text}</span>
      <button onClick={() => removeNotif(id)} className="ml-auto mt-0.5 cursor-pointer">
        <FiX />
      </button>
    </motion.div>
  );
};
