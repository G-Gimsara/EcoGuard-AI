// Seed script for baseline flood impact area data.
const sequelize = require('../Config/sequelize');
const FloodAlert = require('../Models/FloodAear');

// Scenario-style rows for each alert level used by area-impact views.
const floodData = [
  {
    river_rise: "+55mm (Alert ~4ft total)",
    alert_level: "Alert",
    first_affected: [
      { area: "Megoda Kolonnawa GND", depth: "1 ft ankle-deep" }
    ],
    next_affected: [],
    further_affected: [],
    widespread_zones: [
      { area: "All others", depth: "safe" }
    ]
  },
  {
    river_rise: "+100mm (Minor ~5ft total)",
    alert_level: "Minor",
    first_affected: [
      { area: "Megoda Kolonnawa", depth: "2 ft home entry" },
      { area: "Walpola GND Kaduwela", depth: "1 ft yards" }
    ],
    next_affected: [],
    further_affected: [],
    widespread_zones: [
      { area: "Wellampitiya", depth: "dry" },
      { area: "Kelaniya", depth: "dry" }
    ]
  },
  {
    river_rise: "+150mm (~6.5ft total)",
    alert_level: "Moderate",
    first_affected: [
      { area: "Megoda Kolonnawa", depth: "3-4 ft major homes" },
      { area: "Walpola", depth: "2 ft roads" }
    ],
    next_affected: [
      { area: "Wellampitiya", depth: "1 ft pooling" },
      { area: "Kelanimulla GND Kolonnawa", depth: "1-2 ft" }
    ],
    further_affected: [],
    widespread_zones: [
      { area: "Kotikawatta edges", depth: "safe" }
    ]
  },
  {
    river_rise: "+200mm (Major ~7ft total)",
    alert_level: "Major",
    first_affected: [
      { area: "Megoda Kolonnawa", depth: "4-6 ft evacuation" },
      { area: "Walpola", depth: "3 ft households" }
    ],
    next_affected: [
      { area: "Wellampitiya", depth: "2-3 ft" },
      { area: "Kelaniya", depth: "1-2 ft" },
      { area: "Mahadeniya Kaduwela", depth: "2 ft" }
    ],
    further_affected: [
      { area: "Kotikawatta", depth: "1 ft" },
      { area: "Udumulla North GND", depth: "1 ft" }
    ],
    widespread_zones: [
      { area: "Biyagama", depth: "emerging" }
    ]
  },
  {
    river_rise: "+300mm+ (Critical >8ft)",
    alert_level: "Critical",
    first_affected: [
      { area: "Megoda Kolonnawa", depth: "6-10 ft severe" },
      { area: "Walpola", depth: "4-6 ft" }
    ],
    next_affected: [
      { area: "Wellampitiya/Kelaniya", depth: "3-5 ft" },
      { area: "Kaduwela DSD", depth: "3-4 ft" }
    ],
    further_affected: [
      { area: "Kotikawatta/Biyagama", depth: "2-4 ft" },
      { area: "Homagama lowlands", depth: "1-3 ft" }
    ],
    widespread_zones: [
      { area: "Wattala, Colombo DSD lowlands", depth: "2+ ft" },
      { area: "Roads like Baseline", depth: "fully submerged" }
    ]
  }
];

const seedFloodAlerts = async () => {
  try {
    // Rebuild tables from model definitions before inserting seed rows.
    await sequelize.sync({ force: true });
    await FloodAlert.bulkCreate(floodData);
    console.log("Flood data seeded successfully!");
    // Exit explicitly 
  } catch (err) {
    console.error("Error seeding flood data:", err);
    process.exit(1);
  }
};

seedFloodAlerts();