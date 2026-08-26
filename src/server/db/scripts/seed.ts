import { sql } from "drizzle-orm";
import { db } from "../../lib/db";
import {
  users,
  userAccounts,
  settings,
  emailTemplates,
  pages,
  seos,
  blogs,
} from "../../models/schema";
import { hashPassword } from "../../lib/auth/password";
import { encrypt } from "../../lib/encryption";
import { randomBytes } from "crypto";
import { USER_STATUS } from "../../../modules/account/user.constants";

function generateId(): string {
  return randomBytes(16).toString("hex");
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const usersData: (typeof users.$inferInsert)[] = [
  {
    id: generateId(),
    role: "SUPER_ADMIN",
    first_name: "Admin",
    last_name: "Super",
    email: "jackdeveloper100+admin@gmail.com",
    phone: "9898989898",
    two_factor_enabled: false,
    status: "active",
    email_verified: true,
    country: "IN",
    timezone: "Asia/Calcutta",
    registered_ip: "2401:4900:8898:bd6f:4595:a448:33a7:1d6b",
    created_at: new Date("2025-06-19T10:14:40.256Z"),
    updated_at: new Date("2026-02-18T09:38:28.053Z"),
  },
  {
    id: generateId(),
    role: "ADMIN",
    first_name: "jack",
    last_name: "developer",
    email: "jackdeveloper100+subadmin@gmail.com",
    phone: "9898989891",
    timezone: "Asia/Calcutta",
    two_factor_enabled: false,
    email_verified: true,
    status: "active",
    country: "IN",
    permission:
      "admin_admin,admin/admin,admin/admin/view,admin/admin/create,admin/admin/update,admin/admin/delete,admin_user,admin/user,admin/user/view,admin/user/create,admin/user/update,admin/user/delete,admin/user/action,admin/user/autologin,admin/user/mail,admin/user/send-tfa-mail,admin_page,admin/page,admin/page/update,page/,admin_seo,admin/seo/meta,admin/seo/create,admin/seo/update,admin/seo/delete,admin_setting,admin/setting/update,admin_activity,admin/activity,admin_email_template,admin/email_template,admin/email_template/view,admin/email_template/update,admin_device,admin/device,admin/device/logout",
    registered_ip: "2401:4900:8899:7daf:6d39:63cb:35be:ed97",
    created_at: new Date("2025-12-22T11:42:46.820Z"),
    updated_at: new Date("2026-06-16T05:00:57.638Z"),
  },
  {
    id: generateId(),
    role: "USER",
    first_name: "Jack",
    last_name: "developer",
    email: "jackdeveloper100@gmail.com",
    phone: "9898989892",
    registered_ip: "2401:4900:8898:bd6f:4595:a448:33a7:1d6b",
    two_factor_enabled: false,
    email_verified: true,
    status: "active",
    country: "IN",
    timezone: "Asia/Calcutta",
    created_at: new Date("2025-12-23T09:29:57.238Z"),
    updated_at: new Date("2026-06-15T09:23:53.259Z"),
  },
];

const ENCRYPTED_SETTING_KEYS = new Set([
  "google_client_secret",
  "smtp_password",
  "google_recaptcha_secret_key",
]);

const settingsData = [
  {
    key: "google_recaptcha",
    value: "1",
    type: "public",
    group: "captcha",
    updated_at: new Date("2026-06-18T07:14:48.398Z"),
  },
  {
    key: "google_recaptcha_secret_key",
    value: "6LcqacApAAAAAAzMlpaoQaN7zn62dDfEMbJsZJF9",
    type: "private",
    group: "captcha",
    updated_at: new Date("2026-06-18T07:14:48.398Z"),
  },
  {
    key: "google_recaptcha_public_key",
    value: "6LcqacApAAAAAOeMK7u0jdBV07mc2jPo7EUZwCg9",
    type: "public",
    group: "captcha",
    updated_at: new Date("2026-06-18T07:14:48.398Z"),
  },
  {
    key: "smtp_host",
    value: "smtp.gmail.com",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "smtp_port",
    value: "465",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "smtp_encryption",
    value: "ssl",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "smtp_username",
    value: "mailstack365@gmail.com",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "smtp_password",
    value: "bopxjihzmacunhvo",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "mail_from_address",
    value: "mailstack365@gmail.com",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "mail_from_name",
    value: "Next App",
    type: "private",
    updated_at: new Date("2026-06-04T12:26:13.226Z"),
  },
  {
    key: "user_email_verify",
    value: "1",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  {
    key: "user_login_with_otp",
    value: "0",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  {
    key: "admin_email",
    value: "jack@yopmail.com",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  { key: "password_type", value: "1", type: "private" },
  { key: "app_base_url", value: "https://app.tribital.com", type: "public" },
  {
    key: "date_format",
    value: "dd-MM-yyyy",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  {
    key: "date_time_format",
    value: "yyyy-MM-dd hh:mm a",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  {
    key: "google_client_id",
    value:
      "4360060983-s6fei9gsrji2979pddsrn8o7bo8ec7cp.apps.googleusercontent.com",
    type: "public",
    group: "social",
    updated_at: new Date("2026-06-04T12:11:27.941Z"),
  },
  {
    key: "google_client_secret",
    value: "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",
    type: "private",
    group: "social",
    updated_at: new Date("2026-06-04T12:11:27.941Z"),
  },
  {
    key: "google_login",
    value: "1",
    type: "private",
    group: "social",
    updated_at: new Date("2026-06-04T12:11:27.941Z"),
  },
  {
    key: "cookie_consent",
    value: "1",
    type: "public",
    updated_at: new Date("2026-06-18T12:57:29.314Z"),
  },
  {
    key: "header_content",
    value: "",
    type: "public",
    group: "content",
    created_at: new Date("2026-06-17T06:03:54.339Z"),
    updated_at: new Date("2026-06-17T06:04:48.238Z"),
  },
  {
    key: "footer_content",
    value: "",
    type: "public",
    group: "content",
    created_at: new Date("2026-06-17T06:03:54.339Z"),
    updated_at: new Date("2026-06-17T06:04:48.238Z"),
  },
];

const emailTemplatesData = [
  {
    key: "login-link",
    title: "Login Link",
    subject: "Your login link for {{message}} | {{app_name}}",
    body: `<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="color: rgb(0, 0, 0); font-family: &quot;Times New Roman&quot;; font-size: medium;"><tbody><tr><td align="center" valign="top" class="description" style="padding-bottom: 20px;"><h2 class="text-h2" style="color:#000000;font-weight:500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin-right: 0px; margin-bottom: 5px; margin-left: 0px;margin-top:0;">&nbsp;Hello, {{first_name}} {{last_name}}!</h2><h4 class="text" style="font-size: 16px; color: rgb(153, 153, 153); font-family: Poppins, Helvetica, Arial, sans-serif; line-height: 24px;font-weight:500; padding: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px;margin-top: 0px;">Click the button below to continue your {{message}}.</h4><p style="margin-top: 24px;"><a href="{{link}}" style="display:inline-block; background:#1f2937; color:#ffffff; text-decoration:none; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; padding: 14px 28px; border-radius: 8px;">Login link</a></p></td></tr></tbody></table>`,
    params: "first_name,last_name,link,message",
    created_at: new Date("2026-07-01T00:00:00.000Z"),
    updated_at: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    key: "otp",
    title: "OTP",
    subject: "OTP for {{message}} | {{app_name}}",
    body: `<h6 class=""><table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="color: rgb(0, 0, 0); font-family: &quot;Times New Roman&quot;; font-size: medium;"><tbody><tr><td align="center" valign="top" class="description" style="padding-bottom: 20px;"><h2 class="text-h2" style="color:#000000;font-weight:500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin-right: 0px; margin-bottom: 5px; margin-left: 0px;margin-top:0;">&nbsp;Hello, {{first_name}} {{last_name}}!</h2><p style="color: rgb(0, 0, 0); font-weight: 500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin: 0px 0px 5px;"><br></p><h4 class="text" style="font-size: 16px; color: rgb(153, 153, 153); font-family: Poppins, Helvetica, Arial, sans-serif; line-height: 24px;font-weight:500; padding: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px;margin-top: 0px;">Here is your OTP for {{message}}</h4><h3 style="margin-top: 18px;"><span style="display:inline-block; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1f2937; background: #eaf6f2; padding: 12px 20px; border-radius: 999px;">{{otp}}</span></h3></td></tr></tbody></table></h6>`,
    params: "first_name,last_name,otp,message",
    created_at: new Date("2025-12-19T10:20:41.796Z"),
    updated_at: new Date("2026-06-18T13:24:11.286Z"),
  },
  {
    key: "welcome",
    title: "Welcome",
    subject: "Welcome {{first_name}} to {{app_name}}!",
    body: `<table border="0" cellpadding="0" cellspacing="0" width="100%" class="tableDescription" style="color: rgb(0, 0, 0); font-family: &quot;Times New Roman&quot;; font-size: medium;"><tbody><tr><td align="center" valign="top" class="description" style="padding-bottom: 20px;"><h2 class="text-h2" style="color:#000000;font-weight:500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin-right: 0px; margin-bottom: 5px; margin-left: 0px;margin-top:0;">&nbsp;Hello,</h2><h4 class="text" style="font-size: 16px; color: rgb(153, 153, 153); font-family: Poppins, Helvetica, Arial, sans-serif; line-height: 24px;font-weight:500; padding: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px;margin-top: 0px;">Welcome to {{app_name}}</h4><p style="font-family:'Helvetica',sans-serif;font-size:14px;font-weight:500;"><font color="#666666">Thank You!</font></p></td></tr></tbody></table>`,
    params: "first_name,last_name",
    created_at: new Date("2026-01-07T11:36:05.320Z"),
    updated_at: new Date("2026-06-18T08:33:45.064Z"),
  },
  {
    key: "send_mail",
    title: "SendMail",
    subject: "Send Email| {{app_name}}",
    body: `<h2 class="text-h2" style="text-align: center; color: rgb(0, 0, 0); font-weight: 500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin: 0px 0px 5px;">&nbsp;Send Email</h2><h4 class="text" style="text-align: center; font-size: 16px; color: rgb(153, 153, 153); font-family: Poppins, Helvetica, Arial, sans-serif; line-height: 24px; font-weight: 500; padding: 0px; margin: 0px;margin-bottom:20px;"><br></h4><h6 style="font-family: &quot;Open Sans&quot;, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 22px; text-align: left; padding: 0px; margin: 0px;"><font color="#666666"><b><div style="text-align: justify;"><b style="font-size: 0.9375rem; text-align: start;color:#666666!important;">Subject</b><span style="font-size: 0.9375rem; font-weight: 400; text-align: start;color:#666666!important;">:&nbsp;{{subject}}</span></div></b><b><div style="text-align: justify;"><b style="font-size: 0.9375rem; text-align: start;color:#666666 !important;">Description:&nbsp;</b><span style="font-size: 0.9375rem; font-weight:400;color:#666666!important; text-align: start;">{{message}}</span></div></b></font></h6><h6 style="text-align: center;margin-bottom:0; font-family: Helvetica, sans-serif; font-size: 14px; font-weight: 500;"><font color="#666666">Thank You!</font></h6>`,
    params: "first_name,last_name,otp,message",
    created_at: new Date("2026-01-07T11:36:05.320Z"),
    updated_at: new Date("2026-01-07T11:36:05.320Z"),
  },
  {
    key: "admin_contact",
    title: "Contact Us Request",
    subject: "Contact Request | {{app_name}}",
    body: `<h2 class="text-h2" style="text-align: center; color: rgb(0, 0, 0); font-weight: 500; font-family: Poppins, Helvetica, Arial, sans-serif; font-size: 28px; line-height: 36px; padding: 0px; margin: 0px 0px 5px;">&nbsp;Send Email</h2><h4 class="text" style="text-align: center; font-size: 16px; color: rgb(153, 153, 153); font-family: Poppins, Helvetica, Arial, sans-serif; line-height: 24px; font-weight: 500; padding: 0px; margin: 0px;margin-bottom:20px;"><br></h4><h6 style="font-family: &quot;Open Sans&quot;, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 22px; text-align: left; padding: 0px; margin: 0px;"><font color="#666666"><b><div style="text-align: justify;"><b style="font-size: 0.9375rem; text-align: start;color:#666666!important;">Subject</b><span style="font-size: 0.9375rem; font-weight: 400; text-align: start;color:#666666!important;">:&nbsp;{{subject}}</span></div></b><b><div style="text-align: justify;"><b style="font-size: 0.9375rem; text-align: start;color:#666666 !important;">Description:&nbsp;</b><span style="font-size: 0.9375rem; font-weight:400;color:#666666!important; text-align: start;">{{message}}</span></div></b></font></h6><h6 style="text-align: center;margin-bottom:0; font-family: Helvetica, sans-serif; font-size: 14px; font-weight: 500;"><font color="#666666">Thank You!</font></h6>`,
    params: "name,email,subject,message",
    created_at: new Date("2026-01-07T11:36:05.320Z"),
    updated_at: new Date("2026-01-07T11:36:05.320Z"),
  },
];

const pagesData = [
  {
    slug: "terms",
    title: "Terms & Conditions",
    body: "Terms & Conditions",
    status: USER_STATUS.INACTIVE,
    updated_at: new Date("2026-06-10T13:14:32.563Z"),
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    body: "Privacy Policy Page",
    status: USER_STATUS.INACTIVE,
    updated_at: new Date("2026-06-09T13:24:47.897Z"),
  },
];

const seoData = [
  {
    type: "STATIC",
    url: "home",
    title: "Home",
    keyword: "Home",
    description: "HOME",
    meta_title: "Home",
    meta_keyword: "Home",
    meta_description: "HOME",
    last_modified: "2026-02-03 12:27:35",
    change_frequency: "Select Frequency",
    priority: 1,
    status: 1,
    sitemap_enable: 1,
    created_at: new Date("2025-01-17T10:14:40.256Z"),
    updated_at: new Date("2026-06-16T06:15:16.272Z"),
  },
  {
    type: "STATIC",
    url: "contact",
    title: "Contact",
    keyword: "Contact",
    description: "contact",
    meta_title: "Contact",
    meta_keyword: "Contact",
    meta_description: "contact",
    last_modified: "2026-02-03 12:26:53",
    change_frequency: "Select Frequency",
    priority: 1,
    status: 1,
    sitemap_enable: 1,
    created_at: new Date("2025-01-17T10:14:40.256Z"),
    updated_at: new Date("2026-06-16T06:15:28.351Z"),
  },
  {
    type: "STATIC",
    url: "blog",
    title: "Blog",
    keyword: "Blog, AI, Machine Learning",
    description:
      "Read our latest articles on AI, machine learning, and technology.",
    meta_title: "Blog",
    meta_keyword: "Blog, AI, Machine Learning",
    meta_description:
      "Read our latest articles on AI, machine learning, and technology.",
    priority: 0.8,
    status: 1,
    sitemap_enable: 1,
  },
  {
    type: "DYNAMIC",
    url: "blog/*",
    title: "Blog Article",
    keyword: "Blog, AI",
    description: "Blog article detail page.",
    meta_title: "Blog Article",
    meta_keyword: "Blog, AI",
    meta_description: "Blog article detail page.",
    priority: 0.7,
    status: 1,
    sitemap_enable: 1,
  },
];
const blogsData = [
  {
    slug: "understanding-transformer-architecture",
    title: "Understanding the Transformer Architecture That Powers Modern AI",
    excerpt:
      "A deep dive into the transformer architecture, the foundational model behind GPT, BERT, and nearly every modern large language model.",
    body: '<p>The transformer architecture, introduced in the 2017 paper "Attention Is All You Need," revolutionized natural language processing. Unlike recurrent neural networks (RNNs), transformers process all tokens in parallel using a mechanism called self-attention.</p><p>Self-attention allows each token in a sequence to attend to every other token, capturing long-range dependencies far more effectively than RNNs or LSTMs. The architecture consists of an encoder and decoder, each built from stacked layers of multi-head attention and feed-forward networks.</p><p>Key innovations include positional encoding (since transformers have no inherent notion of order), layer normalization, and residual connections. These design choices enable transformers to scale to billions of parameters while remaining trainable.</p><p>Today, decoder-only variants (like GPT) dominate language generation, while encoder-only models (like BERT) excel at understanding tasks. The architecture has also been adapted for vision (ViT), audio (Whisper), and multimodal applications.</p>',
    category: "deep-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-01-15T08:00:00Z"),
    updated_at: new Date("2026-01-15T08:00:00Z"),
  },
  {
    slug: "prompt-engineering-techniques-2026",
    title: "Prompt Engineering Techniques Every Developer Should Know in 2026",
    excerpt:
      "Master the art of crafting effective prompts for large language models with these proven techniques and patterns.",
    body: "<p>Prompt engineering has evolved from a curiosity into a core developer skill. The way you structure instructions for an LLM dramatically affects output quality, consistency, and reliability.</p><p><strong>Chain-of-thought prompting</strong> asks the model to reason step by step before answering, significantly improving accuracy on math, logic, and multi-step problems. Simply adding \"Let's think step by step\" can boost performance by 20-40% on reasoning benchmarks.</p><p><strong>Few-shot prompting</strong> provides examples of the desired input-output pattern. Three well-chosen examples often outperform lengthy instructions. The key is selecting diverse, representative examples that cover edge cases.</p><p><strong>System prompts</strong> set behavioral constraints and persona. They're most effective when they specify what the model should NOT do, define output format explicitly, and establish domain expertise.</p><p>Advanced techniques include ReAct (reasoning + acting), tree-of-thought prompting for complex problem-solving, and structured output formats using JSON schemas for reliable parsing.</p>",
    category: "generative-ai",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-01-22T10:30:00Z"),
    updated_at: new Date("2026-01-22T10:30:00Z"),
  },
  {
    slug: "building-rag-applications",
    title: "Building Production-Ready RAG Applications: A Complete Guide",
    excerpt:
      "Learn how to build Retrieval-Augmented Generation systems that combine the power of LLMs with your own data for accurate, grounded responses.",
    body: "<p>Retrieval-Augmented Generation (RAG) addresses one of the biggest limitations of LLMs: they can't access private or recent data. RAG combines a retrieval system with a generative model, fetching relevant documents before generating a response.</p><p>The typical RAG pipeline has three stages: <strong>indexing</strong> (chunking documents, generating embeddings, storing in a vector database), <strong>retrieval</strong> (finding the most relevant chunks for a query), and <strong>generation</strong> (passing retrieved context to the LLM with the user's question).</p><p>Common pitfalls include chunk sizes that are too large (diluting relevance) or too small (losing context), poor embedding model selection, and not handling cases where the retriever finds nothing relevant.</p><p>Advanced RAG techniques include hybrid search (combining semantic and keyword search), re-ranking retrieved results with a cross-encoder, query decomposition for complex questions, and iterative retrieval where the model asks follow-up queries.</p>",
    category: "generative-ai",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-02-05T09:00:00Z"),
    updated_at: new Date("2026-02-05T09:00:00Z"),
  },
  {
    slug: "ai-ethics-bias-fairness",
    title: "AI Ethics: Addressing Bias and Fairness in Machine Learning Models",
    excerpt:
      "Exploring the critical challenges of bias in AI systems and practical strategies for building fairer, more equitable models.",
    body: "<p>As AI systems increasingly influence hiring, lending, healthcare, and criminal justice decisions, the stakes of biased models have never been higher. Bias in AI isn't just a technical problem — it reflects and amplifies societal inequities.</p><p><strong>Sources of bias</strong> include training data that underrepresents certain groups, label bias from human annotators, measurement bias from proxy variables, and aggregation bias from treating diverse groups as monolithic.</p><p><strong>Detection methods</strong> involve statistical parity analysis, equalized odds testing, calibration checks across subgroups, and counterfactual fairness evaluation. Tools like IBM's AI Fairness 360 and Google's What-If Tool make these analyses more accessible.</p><p><strong>Mitigation strategies</strong> span the entire ML lifecycle: pre-processing (resampling, reweighting), in-processing (adversarial debiasing, constrained optimization), and post-processing (threshold adjustment, calibration). No single approach works universally — the right choice depends on the specific fairness criteria and application context.</p>",
    category: "ai-ethics",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-02-14T11:00:00Z"),
    updated_at: new Date("2026-02-14T11:00:00Z"),
  },
  {
    slug: "computer-vision-real-world-applications",
    title:
      "Computer Vision in 2026: Real-World Applications Transforming Industries",
    excerpt:
      "From autonomous vehicles to medical imaging, discover how computer vision is being deployed at scale across industries.",
    body: "<p>Computer vision has matured from a research curiosity into a production technology deployed across manufacturing, healthcare, agriculture, and transportation. The convergence of better models, cheaper hardware, and edge computing has made real-time visual AI feasible at scale.</p><p><strong>Medical imaging</strong> stands out as a success story. AI models now match or exceed radiologist performance in detecting certain cancers, diabetic retinopathy, and fractures. The key breakthrough was training on datasets of millions of annotated scans, combined with architectures designed for 3D volumetric data.</p><p><strong>Manufacturing quality inspection</strong> uses vision systems to detect defects at speeds and accuracy levels impossible for human inspectors. Modern systems handle variable lighting, part orientation, and novel defect types through few-shot learning approaches.</p><p><strong>Autonomous driving</strong> relies on fusing camera, lidar, and radar data through multi-modal vision models. While full self-driving remains elusive, advanced driver assistance systems (ADAS) have dramatically reduced accident rates in equipped vehicles.</p>",
    category: "computer-vision",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-02-28T08:30:00Z"),
    updated_at: new Date("2026-02-28T08:30:00Z"),
  },
  {
    slug: "fine-tuning-llms-custom-data",
    title: "Fine-Tuning Large Language Models on Custom Data: When and How",
    excerpt:
      "A practical guide to deciding when fine-tuning is worth it versus prompt engineering, and how to do it effectively.",
    body: "<p>Fine-tuning adapts a pre-trained LLM to your specific domain or task by training it on your own data. But it's not always the right choice — understanding when to fine-tune versus when to use prompt engineering or RAG is crucial.</p><p><strong>Fine-tune when</strong> you need consistent style/tone, domain-specific jargon handling, structured output formats, or when prompt engineering hits a ceiling. <strong>Don't fine-tune when</strong> you just need access to specific knowledge (use RAG), your dataset is small (under 100 examples), or the base model already handles the task with good prompts.</p><p><strong>LoRA</strong> (Low-Rank Adaptation) has become the dominant fine-tuning technique. Instead of updating all model weights, LoRA adds small trainable matrices to attention layers, reducing memory requirements by 10-100x while achieving comparable quality to full fine-tuning.</p><p>Best practices include carefully curating training data (quality over quantity), using validation sets to detect overfitting, starting with a small learning rate, and evaluating on diverse test cases that represent real-world usage patterns.</p>",
    category: "machine-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-03-10T14:00:00Z"),
    updated_at: new Date("2026-03-10T14:00:00Z"),
  },
  {
    slug: "nlp-beyond-english",
    title: "NLP Beyond English: Building Multilingual AI Systems",
    excerpt:
      "Most NLP research focuses on English, but the real world speaks 7,000+ languages. Here is how to build AI that works globally.",
    body: "<p>English dominates NLP research and datasets, yet only 17% of the world speaks it. Building truly global AI systems requires rethinking how we approach language understanding across diverse linguistic families.</p><p><strong>Multilingual models</strong> like mBERT and XLM-R demonstrate that a single model can handle 100+ languages through cross-lingual transfer. Training on multiple languages simultaneously creates shared representations that benefit low-resource languages.</p><p><strong>Tokenization challenges</strong> are severe for non-Latin scripts. Standard BPE tokenizers fragment Chinese, Japanese, Korean, Arabic, and Indic scripts into character-level pieces, inflating sequence lengths and degrading performance. Language-specific tokenizers or character-aware architectures help.</p><p><strong>Evaluation gaps</strong> remain significant. Benchmarks like GLUE and SuperGLUE are English-only. XTREME and XGLUE provide multilingual alternatives, but coverage is still sparse for many African, Southeast Asian, and indigenous languages. Community-driven data collection efforts are essential for progress.</p>",
    category: "natural-language-processing",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-03-18T09:00:00Z"),
    updated_at: new Date("2026-03-18T09:00:00Z"),
  },
  {
    slug: "ai-powered-code-generation",
    title: "AI-Powered Code Generation: How It Works and Where It is Heading",
    excerpt:
      "From autocomplete to autonomous coding agents, AI code generation is reshaping software development workflows.",
    body: "<p>AI code generation has progressed from simple autocomplete to sophisticated systems that can plan, implement, test, and debug entire features. This shift is fundamentally changing how developers work.</p><p><strong>Current capabilities</strong> include context-aware code completion, natural language to code translation, automated test generation, code review and bug detection, and refactoring suggestions. Modern coding assistants understand project structure, dependencies, and coding conventions.</p><p><strong>Agentic coding</strong> represents the next frontier. Instead of suggesting one line at a time, coding agents can decompose a task into steps, write code across multiple files, run tests, interpret errors, and iterate until the solution works. This requires planning capabilities, tool use (file I/O, terminal commands), and self-evaluation.</p><p><strong>Limitations</strong> remain real: AI-generated code can contain subtle bugs, security vulnerabilities, or performance issues that look correct at first glance. Human review remains essential, and developers need to understand the code AI generates rather than blindly accepting it.</p>",
    category: "ai-tools",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-03-25T10:00:00Z"),
    updated_at: new Date("2026-03-25T10:00:00Z"),
  },
  {
    slug: "reinforcement-learning-robotics",
    title:
      "Reinforcement Learning in Robotics: From Simulation to the Real World",
    excerpt:
      "How reinforcement learning is enabling robots to learn complex tasks through trial and error, and the sim-to-real transfer challenge.",
    body: "<p>Reinforcement learning (RL) lets robots learn behaviors through trial and error rather than explicit programming. An agent takes actions in an environment, receives rewards, and learns a policy that maximizes cumulative reward over time.</p><p><strong>Sim-to-real transfer</strong> is the central challenge. Training RL agents in simulation is fast and safe, but policies learned in simulation often fail in the real world due to differences in physics, sensor noise, and visual appearance. Domain randomization — varying simulation parameters during training — helps bridge this gap.</p><p><strong>Success stories</strong> include robotic manipulation (picking and placing objects with dexterous hands), locomotion (quadruped robots traversing rough terrain), and drone navigation. OpenAI's work on solving a Rubik's Cube with a robotic hand demonstrated that simulation-trained policies can transfer to reality with sufficient domain randomization.</p><p><strong>Practical considerations</strong> include reward shaping (designing reward functions that guide learning without creating shortcuts), safety constraints (preventing the robot from damaging itself or its environment during exploration), and sample efficiency (real-world interactions are expensive and slow).</p>",
    category: "robotics",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-04-02T08:00:00Z"),
    updated_at: new Date("2026-04-02T08:00:00Z"),
  },
  {
    slug: "vector-databases-explained",
    title: "Vector Databases Explained: The Infrastructure Behind AI Search",
    excerpt:
      "Understanding vector databases, embedding spaces, and similarity search — the backbone of modern AI-powered search and retrieval.",
    body: "<p>Vector databases store and search high-dimensional vectors (embeddings) generated by AI models. They enable semantic search — finding items by meaning rather than keyword matching — and are essential infrastructure for RAG, recommendation systems, and anomaly detection.</p><p><strong>How they work:</strong> Text, images, or other data are converted to dense vectors (typically 256-4096 dimensions) using embedding models. These vectors capture semantic meaning — similar items have nearby vectors. Vector databases index these vectors for fast approximate nearest neighbor (ANN) search.</p><p><strong>Indexing algorithms</strong> trade accuracy for speed. HNSW (Hierarchical Navigable Small World) builds a multi-layer graph structure offering excellent recall at high speed. IVF (Inverted File Index) partitions the vector space into clusters. Product Quantization compresses vectors for memory efficiency. Most production systems combine these approaches.</p><p><strong>Popular options</strong> include Pinecone (fully managed), Weaviate (open-source, hybrid search), Qdrant (Rust-based, fast), ChromaDB (developer-friendly, great for prototyping), and pgvector (PostgreSQL extension for teams already using Postgres).</p>",
    category: "ai-tools",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-04-10T11:00:00Z"),
    updated_at: new Date("2026-04-10T11:00:00Z"),
  },
  {
    slug: "diffusion-models-image-generation",
    title: "How Diffusion Models Generate Images: The Math and Intuition",
    excerpt:
      "Breaking down how diffusion models like Stable Diffusion and DALL-E work, from the noise process to the denoising magic.",
    body: "<p>Diffusion models have become the dominant approach for image generation, powering tools like Stable Diffusion, DALL-E 3, and Midjourney. They work by learning to reverse a gradual noising process.</p><p><strong>The forward process</strong> gradually adds Gaussian noise to an image over many steps until it becomes pure noise. This is a simple, well-understood process described by a fixed noise schedule.</p><p><strong>The reverse process</strong> is where the magic happens. A neural network (typically a U-Net) is trained to predict and remove the noise at each step, gradually recovering a clean image from random noise. The model learns the data distribution by learning to denoise.</p><p><strong>Text conditioning</strong> is achieved through cross-attention between the U-Net and text embeddings from a language model (like CLIP). This allows the model to generate images that match text descriptions by guiding the denoising process.</p><p><strong>Latent diffusion</strong> (used by Stable Diffusion) runs the diffusion process in a compressed latent space rather than pixel space, dramatically reducing computation. An autoencoder compresses images to latents and decompresses the final result.</p>",
    category: "deep-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-04-18T09:30:00Z"),
    updated_at: new Date("2026-04-18T09:30:00Z"),
  },
  {
    slug: "machine-learning-model-evaluation",
    title: "Beyond Accuracy: Properly Evaluating Machine Learning Models",
    excerpt:
      "Accuracy alone is misleading. Learn the metrics, techniques, and pitfalls of evaluating ML models for real-world deployment.",
    body: '<p>A model with 99% accuracy sounds impressive — until you learn the dataset is 99% one class. Proper evaluation requires understanding your data distribution, choosing appropriate metrics, and testing for real-world robustness.</p><p><strong>Classification metrics:</strong> Precision measures "of all positive predictions, how many were correct?" Recall measures "of all actual positives, how many did we find?" F1 balances both. AUC-ROC evaluates across all thresholds. Choose based on whether false positives or false negatives are more costly.</p><p><strong>Regression metrics:</strong> MAE (mean absolute error) is interpretable in original units. RMSE penalizes large errors more. MAPE gives percentage error but breaks with near-zero values. R-squared shows variance explained but can mislead on non-linear data.</p><p><strong>Beyond standard metrics:</strong> Calibration measures whether predicted probabilities match actual frequencies. Fairness metrics check performance across demographic groups. Robustness testing evaluates behavior on adversarial or out-of-distribution inputs. A/B testing validates that offline metrics translate to real-world impact.</p>',
    category: "machine-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-04-25T14:00:00Z"),
    updated_at: new Date("2026-04-25T14:00:00Z"),
  },
  {
    slug: "edge-ai-on-device-inference",
    title: "Edge AI: Running Machine Learning Models on Devices",
    excerpt:
      "Deploying AI models on phones, IoT devices, and edge servers for low-latency, private, offline-capable inference.",
    body: "<p>Edge AI runs machine learning models directly on devices rather than in the cloud. This eliminates network latency, works offline, keeps data private, and reduces cloud costs. But it requires fitting powerful models into constrained hardware.</p><p><strong>Model compression techniques</strong> make this possible. Quantization reduces weight precision from 32-bit floats to 8-bit or 4-bit integers, shrinking model size 4-8x with minimal accuracy loss. Pruning removes unnecessary weights. Knowledge distillation trains a small \"student\" model to mimic a large \"teacher\" model.</p><p><strong>Hardware landscape:</strong> Apple's Neural Engine handles 35+ TOPS for on-device inference. Qualcomm's AI Engine powers Android devices. Google's Edge TPU targets IoT. NVIDIA's Jetson series serves robotics and industrial applications. Each has its own SDK and optimization requirements.</p><p><strong>Frameworks:</strong> TensorFlow Lite and ONNX Runtime are the most portable. Apple's Core ML offers the tightest iOS integration. MediaPipe provides pre-built solutions for common tasks like pose estimation and object detection. The challenge is optimizing for each target platform without maintaining separate codebases.</p>",
    category: "machine-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-05-03T08:00:00Z"),
    updated_at: new Date("2026-05-03T08:00:00Z"),
  },
  {
    slug: "ai-agents-autonomous-systems",
    title: "AI Agents: Building Autonomous Systems That Reason and Act",
    excerpt:
      "Understanding the architecture behind AI agents that can plan, use tools, and complete multi-step tasks autonomously.",
    body: "<p>AI agents go beyond simple question-answering by combining LLMs with planning, memory, and tool use to accomplish complex tasks autonomously. They represent a fundamental shift from AI as a tool to AI as a collaborator.</p><p><strong>Core components:</strong> An agent typically consists of a reasoning engine (LLM), a planning module (task decomposition and sequencing), a memory system (short-term working memory and long-term knowledge), and tool interfaces (APIs, file systems, browsers, code execution).</p><p><strong>Planning approaches:</strong> ReAct interleaves reasoning and acting. Plan-and-execute separates high-level planning from step execution. Reflexion adds self-evaluation loops. Tree-of-thought explores multiple solution paths. The best approach depends on task complexity and error tolerance.</p><p><strong>Challenges:</strong> Agents can get stuck in loops, make compounding errors across steps, struggle with ambiguous instructions, and take unexpected actions. Guardrails, human-in-the-loop checkpoints, and sandboxed execution environments are essential for production deployment.</p>",
    category: "generative-ai",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-05-12T10:00:00Z"),
    updated_at: new Date("2026-05-12T10:00:00Z"),
  },
  {
    slug: "natural-language-processing-sentiment",
    title: "Sentiment Analysis at Scale: Modern NLP Approaches",
    excerpt:
      "From rule-based systems to transformer models, how sentiment analysis has evolved and how to implement it effectively.",
    body: '<p>Sentiment analysis — determining whether text expresses positive, negative, or neutral opinion — is one of the most commercially valuable NLP applications. It powers brand monitoring, customer feedback analysis, financial market sentiment, and content moderation.</p><p><strong>Evolution of approaches:</strong> Early systems used lexicon-based methods (counting positive/negative words). Statistical ML (Naive Bayes, SVMs with TF-IDF features) improved accuracy. Deep learning (LSTMs, CNNs on word embeddings) captured context. Transformers (fine-tuned BERT variants) now dominate with 90%+ accuracy.</p><p><strong>Aspect-based sentiment</strong> goes beyond document-level polarity. "The food was great but the service was terrible" contains positive sentiment about food and negative sentiment about service. Modern approaches use sequence labeling to extract aspect terms and classify sentiment per aspect.</p><p><strong>Practical challenges</strong> include sarcasm detection ("Oh great, another meeting"), domain adaptation (sentiment words differ between restaurant and finance reviews), multilingual sentiment (cultural norms affect expression), and handling mixed sentiment within single documents.</p>',
    category: "natural-language-processing",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-05-20T09:00:00Z"),
    updated_at: new Date("2026-05-20T09:00:00Z"),
  },
  {
    slug: "responsible-ai-development",
    title: "Responsible AI Development: A Framework for Engineering Teams",
    excerpt:
      "Practical guidelines for engineering teams to build AI systems that are safe, transparent, and accountable.",
    body: "<p>Responsible AI isn't just an ethics committee's concern — it's an engineering discipline. Teams building AI systems need practical frameworks for identifying and mitigating risks throughout the development lifecycle.</p><p><strong>Transparency:</strong> Document model capabilities AND limitations. Provide model cards describing training data, intended use cases, known failure modes, and performance across demographic groups. Users should understand when they're interacting with AI and what data is being collected.</p><p><strong>Safety:</strong> Implement content filtering for harmful outputs. Red-team models before deployment. Build kill switches for production systems. Monitor for distribution drift and performance degradation. Plan for adversarial use cases.</p><p><strong>Accountability:</strong> Maintain audit trails for model decisions, especially in high-stakes domains. Enable human override mechanisms. Establish clear ownership for model behavior. Create incident response processes for AI failures.</p><p><strong>Privacy:</strong> Minimize data collection. Implement differential privacy for training. Allow data deletion requests. Audit training data for PII. Consider federated learning for sensitive domains.</p>",
    category: "ai-ethics",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-05-28T11:00:00Z"),
    updated_at: new Date("2026-05-28T11:00:00Z"),
  },
  {
    slug: "object-detection-yolo-evolution",
    title: "The Evolution of YOLO: Real-Time Object Detection",
    excerpt:
      "Tracing the YOLO family from v1 to the latest versions, and why it remains the go-to choice for real-time object detection.",
    body: "<p>YOLO (You Only Look Once) transformed object detection by framing it as a single regression problem rather than a multi-stage pipeline. Since its 2015 debut, the YOLO family has set the standard for real-time detection.</p><p><strong>Key innovations across versions:</strong> YOLOv1 introduced single-shot detection. YOLOv2 added batch normalization and anchor boxes. YOLOv3 used multi-scale predictions with a feature pyramid. YOLOv4 introduced CSPNet backbone and mosaic augmentation. YOLOv5 brought PyTorch accessibility. Later versions continued pushing the speed-accuracy frontier.</p><p><strong>Architecture:</strong> Modern YOLO models use a backbone (feature extraction from input images), a neck (feature aggregation across scales using FPN/PAN), and a head (prediction of bounding boxes, objectness scores, and class probabilities). The single-stage design processes the entire image in one forward pass.</p><p><strong>Deployment:</strong> YOLO's speed makes it ideal for edge deployment. Models can be exported to ONNX, TensorRT, CoreML, and TFLite. Typical inference times range from 1-10ms on GPU, enabling 100+ FPS real-time detection for applications like surveillance, autonomous driving, and industrial inspection.</p>",
    category: "computer-vision",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-06-05T08:30:00Z"),
    updated_at: new Date("2026-06-05T08:30:00Z"),
  },
  {
    slug: "ai-in-healthcare-diagnosis",
    title: "AI in Healthcare: Revolutionizing Diagnosis and Treatment Planning",
    excerpt:
      "How artificial intelligence is transforming medical diagnosis, drug discovery, and personalized treatment recommendations.",
    body: '<p>Healthcare AI is moving from research papers to clinical practice. FDA-cleared AI medical devices have grown exponentially, with applications spanning radiology, pathology, cardiology, and ophthalmology.</p><p><strong>Diagnostic imaging:</strong> AI models detect lung nodules on CT scans, identify diabetic retinopathy from retinal photos, spot fractures on X-rays, and flag suspicious lesions on mammograms. These systems serve as a "second reader," catching findings that human radiologists might miss, especially during high-volume shifts.</p><p><strong>Drug discovery:</strong> AI accelerates the traditionally decade-long drug development process. Models predict protein structures (AlphaFold), identify drug candidates through virtual screening, optimize molecular properties, and predict clinical trial outcomes. Several AI-discovered drugs have entered clinical trials.</p><p><strong>Clinical decision support:</strong> Systems analyze patient records, lab results, and medical literature to suggest diagnoses and treatment plans. Early warning systems predict patient deterioration hours before clinical signs appear, enabling preventive intervention.</p><p><strong>Challenges:</strong> Regulatory approval processes are complex. Clinical validation requires prospective studies. Integration with existing EHR systems is technically challenging. Physician trust must be earned through transparent, explainable predictions.</p>',
    category: "machine-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-06-10T10:00:00Z"),
    updated_at: new Date("2026-06-10T10:00:00Z"),
  },
  {
    slug: "collaborative-robots-cobots",
    title: "Collaborative Robots: AI-Powered Cobots in Modern Manufacturing",
    excerpt:
      "How AI-enabled collaborative robots are working alongside humans in factories, warehouses, and laboratories.",
    body: "<p>Collaborative robots (cobots) are designed to work safely alongside humans without physical barriers. Combined with AI, they're transforming manufacturing from rigid automation to flexible, adaptive production.</p><p><strong>AI capabilities in cobots:</strong> Computer vision enables object recognition and pick-and-place with varying items. Force/torque sensing allows compliant manipulation of delicate objects. Path planning algorithms optimize movements in dynamic environments. Natural language interfaces let operators give verbal instructions.</p><p><strong>Key applications:</strong> Assembly tasks where human dexterity meets robot precision and endurance. Quality inspection combining robot consistency with AI-powered defect detection. Material handling in warehouses where cobots collaborate with human pickers. Laboratory automation for repetitive sample processing.</p><p><strong>Safety standards:</strong> ISO/TS 15066 defines maximum forces and pressures for human-robot contact. AI-powered safety systems use cameras and lidar to detect human proximity and adjust robot speed accordingly. Modern cobots can stop within milliseconds of detecting unexpected contact.</p><p><strong>The future:</strong> Multi-robot coordination, where teams of cobots collaborate on complex tasks. Learning from demonstration, where operators teach new tasks by physically guiding the robot. And adaptive manufacturing, where cobots reconfigure production lines on the fly.</p>",
    category: "robotics",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-06-15T09:00:00Z"),
    updated_at: new Date("2026-06-15T09:00:00Z"),
  },
  {
    slug: "multimodal-ai-models",
    title: "Multimodal AI: Models That See, Hear, Read, and Reason",
    excerpt:
      "The rise of AI models that process text, images, audio, and video simultaneously — and why multimodality matters.",
    body: '<p>Multimodal AI models process and generate content across multiple modalities — text, images, audio, video, and code — within a single unified architecture. This represents a fundamental shift from specialized, single-modality models.</p><p><strong>Architecture approaches:</strong> Early multimodal models used separate encoders per modality with a fusion layer. Modern approaches increasingly use unified transformer architectures that tokenize all modalities into a shared representation space. This enables seamless cross-modal reasoning.</p><p><strong>Capabilities:</strong> Visual question answering ("What\'s happening in this image?"), image generation from text, video understanding and summarization, document analysis (reading charts, tables, diagrams), audio transcription with visual context, and code generation from UI screenshots.</p><p><strong>Applications:</strong> Accessibility tools that describe images for visually impaired users. Content moderation that understands text-in-image memes. Medical AI that reads both clinical notes and imaging. Creative tools that iterate between text descriptions and visual outputs.</p><p><strong>Challenges:</strong> Training data alignment across modalities. Hallucination in visual understanding. Computational costs of processing high-resolution images and long videos. Evaluation benchmarks that genuinely test cross-modal reasoning rather than unimodal shortcuts.</p>',
    category: "deep-learning",
    status: USER_STATUS.ACTIVE,
    created_at: new Date("2026-06-20T08:00:00Z"),
    updated_at: new Date("2026-06-20T08:00:00Z"),
  },
];

// ---------------------------------------------------------------------------
// Seed runner — truncates tables then inserts in FK-safe order
// ---------------------------------------------------------------------------

async function seed() {
  await db.execute(
    sql`TRUNCATE ${users}, ${userAccounts}, ${settings}, ${emailTemplates}, ${pages}, ${seos}, ${blogs} CASCADE`,
  );
  if (usersData.length) {
    await db.insert(users).values(usersData);
    const hashedPw = await hashPassword("111111");
    const accountRows = usersData.map((u) => ({
      id: generateId(),
      account_id: u.id!,
      provider_id: "credential",
      user_id: u.id!,
      password: hashedPw,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
    await db.insert(userAccounts).values(accountRows);
    console.log(`Seeded ${usersData.length} users + userAccount`);
  }

  if (settingsData.length) {
    const encryptedSettings = settingsData.map((s) => ({
      ...s,
      value: ENCRYPTED_SETTING_KEYS.has(s.key) ? encrypt(s.value) : s.value,
    }));
    await db.insert(settings).values(encryptedSettings);
    console.log(`Seeded ${settingsData.length} settings`);
  }

  if (emailTemplatesData.length) {
    await db.insert(emailTemplates).values(emailTemplatesData);
    console.log(`Seeded ${emailTemplatesData.length} email templates`);
  }

  if (pagesData.length) {
    await db.insert(pages).values(pagesData);
    console.log(`Seeded ${pagesData.length} pages`);
  }

  if (seoData.length) {
    await db.insert(seos).values(seoData);
    console.log(`Seeded ${seoData.length} seo entries`);
  }

  if (blogsData.length) {
    await db.insert(blogs).values(blogsData);
    console.log(`Seeded ${blogsData.length} blogs`);
  }

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
