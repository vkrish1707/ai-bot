function sanitizeDateString(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return null;

    // Regular expression to match various date formats: D/M/YY, DD/MM/YYYY, etc.
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

    const match = dateStr.match(datePattern);

    if (!match) return dateStr; // Return original string if not a valid date format

    let [, day, month, year] = match;

    // Ensure day and month are two digits
    day = day.padStart(2, "0");
    month = month.padStart(2, "0");

    // Convert 2-digit year to 4-digit (assume 20XX for now)
    if (year.length === 2) {
        year = "20" + year;
    }

    return `${day}/${month}/${year}`;
}

// Example cases
console.log(sanitizeDateString("1/2/24"));      // "01/02/2024"
console.log(sanitizeDateString("10/5/23"));     // "10/05/2023"
console.log(sanitizeDateString("6/12/99"));     // "06/12/2099"
console.log(sanitizeDateString("15/07/2021"));  // "15/07/2021"
console.log(sanitizeDateString("02/8/19"));     // "02/08/2019"
console.log(sanitizeDateString("29/02/21"));    // "29/02/2021"
console.log(sanitizeDateString("6/9/05"));      // "06/09/2005"
console.log(sanitizeDateString("not a date"));  // "not a date" (invalid, returns as is)
console.log(sanitizeDateString("12/34/56"));    // "12/34/2056" (invalid month but formatted)