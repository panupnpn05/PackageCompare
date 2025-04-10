'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelComparePage() {
  const [fileA, setFileA] = useState(null);
  const [result, setResult] = useState(null);
  const [ProNames, setProName] = useState({});

  const handleFileAChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setFileA(file);
  };

  const handleCompare = async () => {
    if (!fileA) {
      alert('Please upload File A first.');
      return;
    }

    try {
      // Step 1: Read File A (user upload) and select the ReportExport_IvrJourney sheet
      const workbookA = XLSX.read(await fileA.arrayBuffer(), { type: 'array' });
      const sheetA = workbookA.Sheets['ReportExport_IvrJourney'];
      if (!sheetA) {
        alert('Sheet "ReportExport_IvrJourney" not found in File A.');
        return;
      }
      const dataA = XLSX.utils.sheet_to_json(sheetA);

      const oCodes = dataA.map((row) => Object.values(row).find((cell) => typeof cell === 'string' && cell.startsWith('O')));

      console.log('O Codes from File A:', oCodes);

      // Step 2: Read File B (fixed)
      const res = await fetch('/file-b.xlsx');
      const arrayBuffer = await res.arrayBuffer();
      const workbookB = XLSX.read(arrayBuffer, { type: 'array' });

      // Step 3: Map O code to P code from the FBB Pack sheet (Column C to Column D)
      const fbbPackSheet = workbookB.Sheets['FBB Pack'];
      const dataFbbPack = XLSX.utils.sheet_to_json(fbbPackSheet);

      console.log(dataFbbPack)

      const oToPMap = {};
      const ProNames = {};
      
      dataFbbPack.forEach((row) => {
        const oCode = row.__EMPTY_2;
        const pCode = row.__EMPTY_3;
        const ProName = row.__EMPTY_7;
      

        if (oCodes.includes(oCode)) {
          oToPMap[oCode] = pCode;
          ProNames[oCode] = oCode + ' - ' + ProName;
        }
      });

      console.log(oToPMap);
      // const PromotionNames = Object.values()
      const pCodes = Object.values(oToPMap);
      console.log('Mapped P Codes:', pCodes);
      console.log('Promotion Names:', ProNames);

      if (pCodes.length < 2) {
        setResult('❌ Not enough matching P codes found.');
        return;
      }

      // Step 4: Check in MenuPackageList if both P codes are in the same row
      const menuPackageSheet = workbookB.Sheets['Package Menu (FBB)'];
      const dataMenuPackage = XLSX.utils.sheet_to_json(menuPackageSheet, { header: 1 });

      const foundRow = dataMenuPackage.find((row) => {
        return pCodes.every((pCode) => row.includes(pCode));
      });

      if (foundRow) {
        setResult('✅ Both packages are in the same group!');
        setProName(ProNames);
      } else {
        setResult('❌ Packages are not in the same group.');
      }

    } catch (error) {
      console.error(error);
      setResult('⚠️ Error processing files.');
    }
  };

  return (
    <div className="p-6 space-y-4 flex justify-center items-center flex-col">
      <h1 className="text-2xl font-bold">Excel Package Comparator</h1>

      <div>
        <label className="block mb-2">Upload File A (O codes):</label>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileAChange} />
      </div>

      <button
        onClick={handleCompare}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
      >
        Compare Packages
      </button>

      {result && <div className="mt-4 text-lg">{result}</div>}
      {result && (
  <div className="mt-4">
    <h2 className="font-semibold mb-2">Promotion Names:</h2>
    {Object.entries(ProNames).map(([oCode, proName]) => (
      <div key={oCode} className="flex items-center space-x-2 mb-2">
        <span>{proName}</span>
        <button
          onClick={() => {
            const nameOnly = proName.split(' - ')[1]; // take the part after the hyphen
            navigator.clipboard.writeText(nameOnly);
          }}
          className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 text-sm cursor-pointer"
        >
          Copy
        </button>
      </div>
    ))}
  </div>
)}
    </div>
  );
}
