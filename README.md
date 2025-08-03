# Project Overview

This is a full-stack web system built using Node.js, Express.js, and MongoDB Atlas. It handles customer orders, supplier coordination, inventory control, finance reports, and staff management. The system is designed using MVC architecture and integrates with a mobile app (as a partner project) for real-time data syncing.

# Main Features

## 1. Authentication
- Login using email or phone number  
- Role-based access: Admin and Staff  
- Passwords are hashed using bcryptjs  
- Secure token-based login with JWT  

## 2. Customer Order Management
- Create and view customer orders  
- Pagination for easier viewing  
- Track status: New, Shipped, Completed  
- Sorting and filtering by status or date  

## 3. Supplier Order System
- Staff can select products to order from up to 3 suppliers at once  
- Sidebar interface for managing multiple supplier orders  
- Email supplier orders using Nodemailer and SendGrid  
- Add delivery notes and set delivery dates  

## 4. Inventory Management
- Monitor and edit product stock  
- Buttons for reordering and editing stock  
- Product images with fallback handling  

## 5. Finance Module
- Generate daily revenue and expense reports  
- Auto-create completed orders for test/demo  
- Show daily revenue, rider commission, and expenses  
- Generate downloadable PDFs using PDFKit  

## 6. Supplier Management
- CRUD functions for managing supplier information  
- View and edit supplier name, email, and products  
- Rate suppliers based on delivery performance  

## 7. Staff Management
- Create and manage staff accounts  
- Assign Admin or Staff roles  
- Session handling for secure user access  

# Technologies Used

- Backend: Node.js, Express.js  
- Frontend: HTML, CSS, JavaScript  
- Database: MongoDB Atlas  
- Authentication: JWT, bcryptjs  
- Email Service: Nodemailer + SendGrid  
- PDF Reports: PDFKit  
- Session Handling: express-session  
- Configuration: dotenv  

# Architecture

- MVC Model:  
  - Models: MongoDB schemas  
  - Views: HTML/CSS frontend pages  
  - Controllers: Express route logic
