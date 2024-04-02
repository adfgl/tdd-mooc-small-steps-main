import { Temporal } from "@js-temporal/polyfill";
import "./polyfills";
import express from "express";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const type = req.query.type;
    const cost = parseInt(req.query.cost);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age ? parseInt(req.query.age) : undefined;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parseDate(req.query.date);
    const cost = calculateCost(age, type, date, baseCost);
    res.json({ cost });
  });

  function parseDate(dateString) {
    if (dateString) {
      const date1 = new Date(dateString);
      const date2 = Temporal.PlainDate.from(dateString);
      return date1;
    }
  }

  function calculateCost(age, type, date, baseCost) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, baseCost);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, date, baseCost) {
    let reduction = calculateReduction(date);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(date) {
    let reduction = 0;
    if (date){
      let date1 = Temporal.PlainDate.from({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });

      if (isMonday(date) && !isHoliday(date)){
        reduction = 35;
      }
    }
    return reduction;
  }

  function isMonday(date) {
    return date.getDay() === 1;
  }

  function isHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = Temporal.PlainDate.from(row.holiday);
      if (
        year === holiday.year &&
        month === holiday.month && 
        day === holiday.day
      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
