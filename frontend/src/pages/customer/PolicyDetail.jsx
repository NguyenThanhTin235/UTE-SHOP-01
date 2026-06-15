import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import FABGroup from '../../components/FABGroup';

const policiesData = {
  'orders-shipping': {
    title: 'Orders & Shipping Policy',
    icon: 'local_shipping',
    color: 'text-primary',
    bg: 'bg-blue-50',
    sections: [
      {
        heading: 'Order Processing',
        content: 'All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.'
      },
      {
        heading: 'Shipping Rates & Estimates',
        content: 'Shipping charges for your order will be calculated and displayed at checkout. We offer standard shipping (3-5 business days) and express shipping (1-2 business days) across most regions. Free shipping is available for orders over 500,000 VND.'
      },
      {
        heading: 'How do I check the status of my order?',
        content: 'When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available. You can also track your order in the "My Orders" section of your account.'
      },
      {
        heading: 'Changing Delivery Address',
        content: 'If you need to change your delivery address after placing an order, please contact our support team immediately. We can only change the address if the order has not yet been handed over to the shipping carrier.'
      }
    ]
  },
  'returns-refunds': {
    title: 'Returns & Refunds Policy',
    icon: 'assignment_return',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    sections: [
      {
        heading: '15-Day Return Policy',
        content: 'We accept returns up to 15 days after delivery, if the item is unused and in its original condition, and we will refund the full order amount minus the shipping costs for the return.'
      },
      {
        heading: 'Conditions for Return',
        content: 'To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.'
      },
      {
        heading: 'Refund Process',
        content: 'Once we receive and inspect your return, we will let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method within 5-7 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.'
      },
      {
        heading: 'Exceptions / Non-returnable items',
        content: 'Certain types of items cannot be returned, like perishable goods, custom products, and personal care goods. We also do not accept returns for hazardous materials, flammable liquids, or gases.'
      }
    ]
  },
  'payments-wallets': {
    title: 'Payments & Wallets Policy',
    icon: 'payments',
    color: 'text-[#ba1a1a]',
    bg: 'bg-red-50',
    sections: [
      {
        heading: 'Accepted Payment Methods',
        content: 'We accept various payment methods including Cash on Delivery (COD), VNPay (ATM cards, Visa, Mastercard, JCB), and UTEShop Coins. All online payments are securely processed through our encrypted payment gateway partners.'
      },
      {
        heading: 'UTEShop Coins',
        content: 'You earn UTEShop Coins for every successful purchase (10,000 VND spent = 100 Coins). Coins can be redeemed during checkout for discounts at a rate of 1 Coin = 1 VND. Coins expire 6 months after they are earned.'
      },
      {
        heading: 'Payment Security',
        content: 'Your security is our priority. We do not store your credit card details on our servers. All transactions are encrypted using Secure Socket Layer (SSL) technology and compliant with PCI-DSS standards.'
      },
      {
        heading: 'Failed Transactions',
        content: 'If your payment fails, the order will be marked as cancelled or pending payment. Any deducted amount for a failed transaction will be automatically refunded by your bank within 3-5 business days.'
      }
    ]
  },
  'account-security': {
    title: 'Account & Security Policy',
    icon: 'verified_user',
    color: 'text-[#2e7d32]',
    bg: 'bg-green-50',
    sections: [
      {
        heading: 'Account Responsibility',
        content: 'You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer/device. You agree to accept responsibility for all activities that occur under your account.'
      },
      {
        heading: 'Password Requirements',
        content: 'For your protection, passwords must be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special characters. We recommend updating your password every 90 days.'
      },
      {
        heading: 'Two-Factor Authentication (2FA)',
        content: 'We strongly encourage enabling 2FA in your account settings. This adds an extra layer of security by requiring a verification code sent to your email or phone when logging in from a new device.'
      },
      {
        heading: 'Reporting Suspicious Activity',
        content: 'If you notice any unauthorized access or suspicious activity on your account, please contact our support team immediately. We will temporarily freeze your account to prevent any fraudulent transactions while we investigate.'
      }
    ]
  }
};

const PolicyDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (policiesData[slug]) {
      setPolicy(policiesData[slug]);
    } else {
      // If invalid slug, redirect back to support
      navigate('/support');
    }
  }, [slug, navigate]);

  if (!policy) return null;

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-margin-mobile py-24 space-y-12">
        {/* Header Section */}
        <section className="bg-white p-8 md:p-12 rounded-[2rem] border border-[#c3c6d7]/30 shadow-sm flex items-center gap-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${policy.bg} ${policy.color}`}>
            <span className="material-symbols-outlined text-4xl">{policy.icon}</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#131b2e]">{policy.title}</h1>
            <p className="text-[#434655] font-medium mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        {/* Content Sections */}
        <section className="space-y-8">
          {policy.sections.map((sec, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] border border-[#c3c6d7]/30 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-black text-[#131b2e] mb-4 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${policy.bg} ${policy.color}`}>
                  {idx + 1}
                </span>
                {sec.heading}
              </h2>
              <p className="text-[#434655] font-medium leading-relaxed pl-11">
                {sec.content}
              </p>
            </div>
          ))}
        </section>

        {/* Call to Action */}
        <section className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 text-center space-y-4">
          <h3 className="text-xl font-black text-[#131b2e]">Still need help?</h3>
          <p className="text-[#434655] font-medium">If you couldn't find the answer to your question, our support team is here to help.</p>
          <Link to="/support" className="inline-block mt-4 px-8 py-3 bg-primary text-white rounded-full text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/30">
            Contact Support
          </Link>
        </section>
      </main>

      <Footer />
      <FABGroup />
    </div>
  );
};

export default PolicyDetail;
