import React from "react";
import Link from "next/link";
import config from "@/config";
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className=" py-6 px-15 flex flex-col md:flex-row justify-between items-center text-sm ">
      <div className="text-center md:text-left">
        Â©{currentYear}, made by&nbsp;
        <a href="/" target="_blank" className="font-medium text-blue-600">
          {config.APP_NAME}
        </a>
      </div>
      <div className="hidden md:flex space-x-4">
        <Link
          href="/page/terms"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Terms & Condition
        </Link>
        <Link
          href="/page/privacy-policy"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
