This is a [Next.js]# Google reCAPTCHA v2 Setup

To enable spam protection on login and registration forms:

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" and select reCAPTCHA v2 ("I'm not a robot" Checkbox)
3. Add your domain (e.g., `localhost`, `yourdomain.com`)
4. Copy the Site Key to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy the Secret Key to `RECAPTCHA_SECRET_KEY`nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Setup Instructions

### 1. Environment Variables

Copy the `.env` file and configure the following variables:

```bash
```bash
# Database & Authentication

```

### 2. Google reCAPTCHA Setup

To enable spam protection on login and registration forms:

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" and select reCAPTCHA v3
3. Add your domain (e.g., `localhost`, `yourdomain.com`)
4. Copy the Site Key to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
5. Copy the Secret Key to `RECAPTCHA_SECRET_KEY`

### 3. Database Setup

Run the SQL scripts in order:
1. `database_schema.sql` - Creates tables and relationships
2. `create_course_ratings_table.sql` - Creates ratings table

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **User Authentication**: Login/Register with role-based access (Student, Teacher, Admin)
- **Course Management**: Create, manage, and enroll in courses
- **Progress Tracking**: Monitor learning progress
- **Admin Dashboard**: User and course management with bulk operations
- **Spam Protection**: Google reCAPTCHA v2 on login/register forms
- **File Upload**: Material uploads with Supabase Storage

## Security Features

- JWT-based authentication
- Role-based access control
- reCAPTCHA v2 spam protection
- Password hashing
- Secure cookie handling

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
