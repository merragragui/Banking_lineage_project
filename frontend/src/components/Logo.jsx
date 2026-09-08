import React from 'react';

export const Logo = ({ size = 'medium' }) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  // Height and width scaled so logo fills the sidebar container completely
  const logoMaxHeight = isLarge ? '90px' : isSmall ? '40px' : '75px';

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img 
        src="/logo_BP.png" 
        alt="Banque Populaire du Maroc" 
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: logoMaxHeight,
          objectFit: 'contain',
          display: 'block'
        }} 
      />
    </div>
  );
};
