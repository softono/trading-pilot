import { describe, it, expect } from "vitest";
import { contactSchema } from "@/modules/public/contactMessage.validator";
import { blogSaveSchema, blogCategorySchema } from "@/modules/blog/blog.validator";
import { userStatusSchema, userRoleSchema } from "@/modules/account/user.validator";

describe("contactSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@example.com",
    subject: "Hello",
    message: "A message",
    captcha_token: "token",
  };

  it("accepts a valid payload", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing email", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.email;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      contactSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects a missing captcha token", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.captcha_token;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });
});

describe("blogSaveSchema", () => {
  const valid = {
    title: "A post",
    slug: "a-post",
    excerpt: "Short summary",
    body: "<p>content</p>",
    category: "technology",
    status: "active",
  };

  it("accepts a valid payload", () => {
    expect(blogSaveSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(blogSaveSchema.safeParse({ ...valid, title: "" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid status", () => {
    expect(
      blogSaveSchema.safeParse({ ...valid, status: "archived" }).success,
    ).toBe(false);
  });
});

describe("shared domain enums", () => {
  it("userStatusSchema accepts active/inactive only", () => {
    expect(userStatusSchema.safeParse("active").success).toBe(true);
    expect(userStatusSchema.safeParse("inactive").success).toBe(true);
    expect(userStatusSchema.safeParse("banned").success).toBe(false);
  });

  it("userRoleSchema rejects unknown roles", () => {
    expect(userRoleSchema.safeParse("ROOT").success).toBe(false);
  });

  it("blogCategorySchema rejects unknown categories", () => {
    expect(blogCategorySchema.safeParse("not-a-category").success).toBe(false);
  });
});
