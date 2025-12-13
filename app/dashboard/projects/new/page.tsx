"use client";
import { useState } from "react";

export default function IntakeFormV4() {
  const [formData, setFormData] = useState({
    projectName: "",
    sponsorName: "",
    address: "",
    censusTract: "",
    totalCost: "",
    requestedNMTC: "",
    requestedHTC: "",
    requestedLIHTC: "",
    shovelReady: false,
    email: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetch("/api/intake/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).then(() => alert("Submitted"));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-white">
      <h1 className="text-2xl font-bold mb-6">New Project Intake Form (v4)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="projectName" placeholder="Project Name" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="sponsorName" placeholder="Sponsor/Org Name" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="address" placeholder="Project Address" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="censusTract" placeholder="Census Tract" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="totalCost" placeholder="Total Project Cost" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="requestedNMTC" placeholder="Requested NMTC" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="requestedHTC" placeholder="Requested HTC" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <input name="requestedLIHTC" placeholder="Requested LIHTC" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="shovelReady" onChange={handleChange} />
          <span>Shovel Ready?</span>
        </label>
        <input name="email" placeholder="Contact Email" onChange={handleChange} className="w-full p-2 bg-slate-800 rounded" />
        <button type="submit" className="mt-4 bg-indigo-600 px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  );
}
