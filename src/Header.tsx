import  React from 'react';
import './App.css';

function Header({backgroundColor}: {backgroundColor: string}) {
  return (
    <div id="header" style={{backgroundColor, color: 'rgb(220,220,220)', fontSize: '22px', lineHeight: '60px', opacity: .9, height: '60px', width: '100%', boxShadow: '0px 2px 10px gray'}}>
        <span style={{marginLeft: '12px'}}> NYC Subway Performance </span>
    </div>
  );
}

export default Header;
