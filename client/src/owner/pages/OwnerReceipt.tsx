import React from 'react';
import { ReceiptSettings } from '../../pages/ReceiptSettings';

export const OwnerReceipt: React.FC = () => {
  return <ReceiptSettings isOwnerPortal={true} />;
};
