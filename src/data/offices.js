export const OFFICES = [
  // SON Region
  { code: 'TOX1', name: 'Toronto Streets (Senior)', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Streets', isFR: false },
  { code: 'TOS1', name: 'Toronto Streets 1', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Streets', isFR: false },
  { code: 'TOS2', name: 'Toronto Streets 2', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Streets', isFR: false },
  { code: 'TOD1', name: 'Toronto Doors 1', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Doors', isFR: false },
  { code: 'TOD2', name: 'Toronto Doors 2', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Doors', isFR: false },
  { code: 'TOD3', name: 'Toronto Doors 3 (Mississauga)', manager: 'Patrick Jukes', region: 'SON', city: 'Toronto', medium: 'Doors', isFR: false },
  { code: 'TOM1', name: 'Toronto Malls 1', manager: 'Ishak Ramos', region: 'SON', city: 'Toronto', medium: 'Malls', isFR: false },
  { code: 'TOM2', name: 'Toronto Malls 2', manager: 'Andrea Chevannes', region: 'SON', city: 'Toronto', medium: 'Malls', isFR: false },
  { code: 'TOM3', name: 'Toronto Malls 3', manager: 'Ishak Ramos', region: 'SON', city: 'Toronto', medium: 'Malls', isFR: false },
  { code: 'GTS1', name: 'GTA Streets', manager: 'Samantha Zindoga', region: 'SON', city: 'Toronto', medium: 'Streets', isFR: false },
  { code: 'OTS1', name: 'Ottawa Streets 1', manager: 'Samantha Zindoga', region: 'SON', city: 'Ottawa', medium: 'Streets', isFR: false },
  { code: 'OTD1', name: 'Ottawa Doors 1', manager: 'Youssef El Hassnaoui', region: 'SON', city: 'Ottawa', medium: 'Doors', isFR: false },
  { code: 'OTD2', name: 'Ottawa Doors 2', manager: 'Kole McDougall', region: 'SON', city: 'Ottawa', medium: 'Doors', isFR: false },
  { code: 'OIB1', name: 'Ottawa Bilingual', manager: 'Mansour Ndiaye', region: 'SON', city: 'Ottawa', medium: 'Streets', isFR: true },
  { code: 'HTD1', name: 'Hamilton Doors 1', manager: 'Samantha Robinson', region: 'SON', city: 'Hamilton', medium: 'Doors', isFR: false },

  // EAST Region
  { code: 'EDD1', name: 'Edmonton Doors 1', manager: 'Liam Epps', region: 'EAST', city: 'Edmonton', medium: 'Doors', isFR: false },
  { code: 'HXD1', name: 'Halifax Doors 1', manager: 'Jacob Hounsell', region: 'EAST', city: 'Halifax', medium: 'Doors', isFR: false },
  { code: 'HXS1', name: 'Halifax Streets 1', manager: 'Jacob Hounsell', region: 'EAST', city: 'Halifax', medium: 'Streets', isFR: false },
  { code: 'FFS1', name: 'Fredericton Streets 1', manager: 'Jacob Hounsell', region: 'EAST', city: 'Fredericton', medium: 'Streets', isFR: false },
  { code: 'CYD1', name: 'Calgary Doors 1', manager: 'Atif Abu Naji', region: 'EAST', city: 'Calgary', medium: 'Doors', isFR: false },
  { code: 'CYS1', name: 'Calgary Streets 1', manager: 'Shams Umar', region: 'EAST', city: 'Calgary', medium: 'Streets', isFR: false },

  // BC Region
  { code: 'VNS1', name: 'Vancouver Streets 1', manager: 'Salma Al Dehaybi', region: 'BC', city: 'Vancouver', medium: 'Streets', isFR: false },
  { code: 'VNS2', name: 'Vancouver Streets 2 (HSF)', manager: 'Adi Battan', region: 'BC', city: 'Vancouver', medium: 'Streets', isFR: false },
  { code: 'VND1', name: 'Vancouver Doors 1', manager: 'Sarah McLeod', region: 'BC', city: 'Vancouver', medium: 'Doors', isFR: false },
  { code: 'VND2', name: 'Vancouver Doors 2', manager: 'Jael Kleinsasser', region: 'BC', city: 'Vancouver', medium: 'Doors', isFR: false },
  { code: 'VNM1', name: 'Vancouver Malls 1', manager: 'Vishal Sehrawat', region: 'BC', city: 'Vancouver', medium: 'Malls', isFR: false },

  // QC Region
  { code: 'MBS1', name: 'Montréal Branded Streets', manager: 'Gregoire Speciel', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MND1', name: 'Montréal Nomad 1', manager: 'Zakary Caron', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MND2', name: 'Montréal Nomad 2', manager: 'Alice Caisse', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MTM1', name: 'Montréal Malls', manager: 'Claire Florentiny', region: 'QC', city: 'Montréal', medium: 'Malls', isFR: true },
  { code: 'MTD1', name: 'Montréal Doors 1', manager: 'Claire Florentiny', region: 'QC', city: 'Montréal', medium: 'Doors', isFR: true },
  { code: 'MTD2', name: 'Montréal Doors 2', manager: 'Naima Sami', region: 'QC', city: 'Montréal', medium: 'Doors', isFR: true },
  { code: 'MTB1', name: 'Montréal Bilingual', manager: 'Emile Desmarais Lambert', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MTE1', name: 'Montréal East', manager: 'Fatima Zahra Essaoud', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MOS1', name: 'Montréal Streets 1', manager: 'Claire Florentiny', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MOS2', name: 'Montréal Streets 2', manager: 'Xavier Lequin', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'MOP1', name: 'Montréal PFU 1', manager: 'Reedhwana Syed Ahmed', region: 'QC', city: 'Montréal', medium: 'Doors', isFR: true },
  { code: 'MOH1', name: 'Montréal OH 1', manager: 'Florian Chabert', region: 'QC', city: 'Montréal', medium: 'Doors', isFR: true },
  { code: 'GMA1', name: 'Greater Montréal Area', manager: 'Thomas Gabriel Moore', region: 'QC', city: 'Montréal', medium: 'Streets', isFR: true },
  { code: 'QCD1', name: 'Québec City Doors', manager: 'Jean-François Bouteloup Levesque', region: 'QC', city: 'Québec City', medium: 'Doors', isFR: true },
  { code: 'GAD1', name: 'Gatineau Doors', manager: 'David Mugglebee', region: 'QC', city: 'Gatineau', medium: 'Doors', isFR: true },

  // PHONES Region
  { code: 'PIO2', name: 'Phones IO 2', manager: 'Michael Patten', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO3', name: 'Phones IO 3', manager: 'Emily Sewuster', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO4', name: 'Phones IO 4', manager: 'Zoe Ashdown', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO5', name: 'Phones IO 5', manager: 'Mikayla Lynn-Acton', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO6', name: 'Phones IO 6', manager: 'Vic Willard', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO7', name: 'Phones IO 7', manager: 'Graham Breault', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'PIO8', name: 'Phones IO 8', manager: 'Felicity Storey-Tranberg', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: false },
  { code: 'FPIO', name: 'French Phones', manager: 'Meriem Nachete', region: 'PHONES', city: 'Remote', medium: 'Phones', isFR: true },
]

export const CHARITIES = [
  'AIC', 'BCCHF', 'CAMH', 'CNIB', 'STC', 'CARE', 'UNICEF',
  'Red Cross / CRC', 'OXFAM', 'INCA', 'SKF', 'NCC', 'AICF',
  'MSF', 'CNC', 'OXQ', 'MCHF', 'EQT', 'HSF'
]

export const SOURCES = [
  'Indeed', 'Calendly', 'Direct Recruitment', 'RFU',
  'Facebook/Instagram', 'Referral', 'Other'
]

export const STATUSES = [
  'Pending', 'Hired', 'Rejected', 'No Show', 'Follow-up', '2nd Interview'
]

export const AVAILABILITY = ['20–25 hrs', '25–35 hrs', '35–40 hrs']

export const REGIONS = ['SON', 'QC', 'BC', 'EAST', 'PHONES']
