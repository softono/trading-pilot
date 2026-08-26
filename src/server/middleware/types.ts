import { NextRequest } from "next/server";
import type { IUser } from "@/server/models/user";
import type { IUserSession } from "@/server/models/user-session";

export interface NextRequestWithUser extends NextRequest {
  user?: IUser;
  session?: IUserSession;
}

export interface NextRequestWithAdmin extends NextRequest {
  user?: IUser;
  session?: IUserSession;
}
