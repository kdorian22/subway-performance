import  React, { useState, useMemo } from 'react';
import './App.css';
import Header from './Header';
import { Colors, ColorsAPI, PerformanceEvent } from './Types';
import PerformancePlot from './PerformancePlot';


const getColors = async (
  setColors: (colors: Colors) => void,
  setIsLoading: (isLoading: boolean) => void
) => {
  const apiResp  = await fetch(`https://data.ny.gov/resource/3uhz-sej2.json`, {
    method: 'GET',
  })

  const resp: ColorsAPI[] = await apiResp.json()

  const colors: Colors =  {}

  resp.forEach((d) => {
    const lines = d.service.split(',')
    lines.forEach((l) => {
      colors[l] = d.hex_color
    })
  })

  setColors(colors)
  setIsLoading(false)
}

const getData = async (
  setEventData: (data: PerformanceEvent[]) => void, 
  incidentsOrDelays: 'I' | 'D',
  setIsLoading: (isLoading: boolean) => void
) => {
  let newData = true
  let offset = 0
  let events: PerformanceEvent[] = []

  const endpoint = incidentsOrDelays === 'I' ? 'j6d2-s8m2' : 'wx2t-qtaz' 
  try{
    while(newData){
      const resp = await fetch(`https://data.ny.gov/resource/${endpoint}.json?$offset=${offset}`, {
        method: 'GET',
      })
  
      const data = await resp.json();
      if(data.length === 0){
        newData = false
        setIsLoading(false)
      }else{
        events = [
          ...events, 
          ...(data.map((d: any) => ({
          month: d.month, 
          division: d.division, 
          line: d.line,day_type: Number(d.day_type), 
          category: incidentsOrDelays === 'I' ? d.category : d.reporting_category, 
          count: incidentsOrDelays === 'I' ? Number(d.count) : Number(d.delays)  
        })))
      ]
        offset += 1000
      }
    }
  }catch{
    setIsLoading(false)
  }

  void setEventData(events)
}

function App() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<PerformanceEvent[]>([])
  const [delays, setDelays] = useState<PerformanceEvent[]>([])
  const [colors, setColors] = useState<Colors>({})

  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true)
  const [isLoadingDelays, setIsLoadingDelays] = useState(true)
  const [isLoadingColors, setIsLoadingColors] = useState(true)

  if(!incidents.length && isLoadingIncidents){
    getData(setIncidents, 'I', setIsLoadingIncidents)
  }

  if(!delays.length && isLoadingDelays){
    getData(setDelays, 'D', setIsLoadingDelays)
  }

  if(!colors.length && isLoadingColors){
    getColors(setColors, setIsLoadingColors)
  }
  const activeLines = useMemo<string[]>(() => {
    if(!isLoadingDelays && !isLoadingIncidents && colors){
      return Array.from(new Set([...incidents.map((d) => d.line), ...delays.map((d) => d.line)])).filter((d) => d in colors)
    }
    return []
  }, [isLoadingDelays, isLoadingIncidents, incidents, delays, colors])
  
  return (
    <>
      <Header backgroundColor={colors['MTA'] || 'rgb(0, 57, 165)'}/>
      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', padding: '12px'}}>
        <PerformancePlot selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} incidents={incidents} delays={delays} lines={activeLines} colors={colors} />
      </div>
    </>
  );
}

export default App;
