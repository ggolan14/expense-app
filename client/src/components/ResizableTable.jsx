import React, { useEffect, useRef } from 'react';
import './ResizableTable.css';

const ResizableTable = ({ columns, data }) => {
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      makeColumnsResizable(tableRef.current);
    }
  }, [data]);

  return (
    <table ref={tableRef} className="resizable-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.isArray(data) &&
          data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default ResizableTable;

// פונקציה להפיכת עמודות לניתנות לגרירה
function makeColumnsResizable(table) {
  const cols = table.querySelectorAll("th");

  cols.forEach((col) => {
    const resizer = document.createElement("div");
    resizer.style.width = "5px";
    resizer.style.height = "100%";
    resizer.style.position = "absolute";
    resizer.style.top = "0";
    resizer.style.right = "0";
    resizer.style.cursor = "col-resize";
    resizer.style.userSelect = "none";

    col.style.position = "relative";
    col.appendChild(resizer);

    resizer.addEventListener("mousedown", (e) => {
      const startX = e.pageX;
      const startWidth = col.offsetWidth;

      const onMouseMove = (e) => {
        const newWidth = startWidth + (e.pageX - startX);
        col.style.width = `${newWidth}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
}
