import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  async exportToExcel<T extends object>(
    data: T[],
    fileName: string,
    sheetName: string = 'Sheet 1'
  ): Promise<void> {
    if (data.length === 0) {
      console.warn('No data available for export.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers dynamically
    const headers = Object.keys(data[0]) as (keyof T)[];
    worksheet.addRow(headers as string[]);

    // Add rows dynamically
    data.forEach((item) => {
      const row = headers.map((header) => item[header]);
      worksheet.addRow(row as any[]);
    });

    // Auto-width columns
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) maxLength = length;
      });
      column.width = maxLength + 2;
    });

    // Export to Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${fileName}.xlsx`);
  }
}
