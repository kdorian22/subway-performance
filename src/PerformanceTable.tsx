import  React from 'react';
import './App.css';
import { PerformanceEvent, Colors } from './Types';
import { rollup, sum, descending } from 'd3';
import dayjs from 'dayjs';


type PerformanceTableProps = {
    data: PerformanceEvent[]
    colors: Colors
    selectedLine: string | null
    incidentOrDelay: 'I' | 'D'
    selectedMonth: string | null
}



function PerformanceTable({
        data, 
        colors, 
        selectedLine,
        incidentOrDelay,
        selectedMonth,
    }: PerformanceTableProps) {
    if(!selectedMonth || !selectedLine ) return <></>
    const rows = data.filter((d) => d.month === selectedMonth && d.line === selectedLine)
    const groupedData = Array.from(rollup(rows, (v) => sum(v.map((d) => d.count)), (d) => d.category)).sort((a, b) => descending(a[1], b[1]))

    return (
        <div style={{width: '100%'}}>
            <span style={{fontSize: '14px', fontWeight: 'bold'}}> {selectedLine} Train {incidentOrDelay === 'I' ? 'Major Incidents' : 'Delays'} - {dayjs(selectedMonth).format('MMM YYYY')}</span>
            {selectedLine && (
                <table style={{marginTop: '6px', maxHeight: '300px',  borderCollapse: 'collapse', width: '100%'}}>
                <thead>
                <tr>
                    <th style={{backgroundColor: colors[selectedLine], color: ['N', 'R', 'W', 'Q'].includes(selectedLine) ? 'black' : 'white', textAlign: 'left'}}> {incidentOrDelay === 'I' ? 'Incident' : 'Delay'} Type </th>
                    <th style={{backgroundColor: colors[selectedLine], color: ['N', 'R', 'W', 'Q'].includes(selectedLine) ? 'black' : 'white', textAlign: 'left'}}> Count </th>
                </tr>
                </thead>
                <tbody>
                    {groupedData.map((d) => {
                        return (
                            <tr>
                                <td>{d[0].replace('/Police/Medical', '')}</td>
                                <td>{d[1]}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            )}
            
        </div>
    );
}

export default PerformanceTable;
