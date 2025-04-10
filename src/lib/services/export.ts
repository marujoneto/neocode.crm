import Papa from "papaparse";

interface ExportOptions {
  filename: string;
  data: any[];
  fields?: string[];
}

export const exportService = {
  toCSV({ filename, data, fields }: ExportOptions) {
    const csv = Papa.unparse({
      fields: fields || Object.keys(data[0] || {}),
      data: data.map((item) => {
        const row = { ...item };
        delete row.id; // Remove internal ID
        return row;
      }),
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  toJSON({ filename, data }: ExportOptions) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
