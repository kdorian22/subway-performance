import  React from 'react';
import './App.css';

function Header({backgroundColor}: {backgroundColor: string}) {
  return (
    <div id="header" style={{backgroundColor, color: 'rgb(220,220,220)', paddingLeft: '10px', fontSize: '22px', lineHeight: '60px', opacity: .9, height: '60px', width: '100%', boxShadow: '0px 2px 10px gray'}}>
        NYC Subway Performance
    </div>
  );
}

export default Header;
