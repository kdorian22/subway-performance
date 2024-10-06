import  React, {useState} from 'react';
import './App.css';

type event = {
  month: string,
  division: string,
  line: string,
  day_type: number,
  category: string,
  count: number
}

const getData = async (
  setEventData: (data: event[]) => void, 
  incidentsOrDelays: 'I' | 'D',
  setIsLoading: (isLoading: boolean) => void
) => {
  let newData = true
  let offset = 0
  let events: event[] = []

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
  const [incidents, setIncidents] = useState<event[]>([])
  const [delays, setDelays] = useState<event[]>([])

  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true)
  const [isLoadingDelays, setIsLoadingDelays] = useState(true)

  if(!incidents.length && isLoadingIncidents){
    getData(setIncidents, 'I', setIsLoadingIncidents)
  }

  if(!delays.length && isLoadingDelays){
    getData(setDelays, 'D', setIsLoadingDelays)
  }

  return (
    <div onClick={() => console.log('Incidents', incidents.slice(0, 5), incidents.length)} className="App">
			NYC Subway Performance
      <div> Total Incidents: {isLoadingIncidents ? '#...' : incidents.length} </div>
      <div> Total Delays: {isLoadingDelays ? '#...' : delays.length} </div>
    </div>
  );
}

export default App;
