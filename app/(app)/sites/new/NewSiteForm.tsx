"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "./SubmitButton";
import { createSite, initialState } from "./actions";

export function NewSiteForm() {
  const [state, formAction] = useFormState(createSite, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <label className="block text-label">Site name</label>
        <input
          type="text"
          name="site_name"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
          placeholder="Helston"
        />
      </div>

      <div>
        <label className="block text-label">Address</label>
        <input
          type="text"
          name="address"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
          placeholder="Street, town, postcode"
        />
      </div>

      <div>
        <label className="block text-label">
          Reference code{" "}
          <span className="text-zinc-500 font-normal text-xs">(optional)</span>
        </label>
        <input
          type="text"
          name="reference_code"
          placeholder="e.g. 23/00123/FUL"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
        />
        <p className="mt-1 text-xs text-zinc-600">
          Council planning reference or internal tracking code
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-label">Local planning authority</label>
          <input
            type="text"
            name="local_planning_authority"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
            placeholder="Cornwall"
          />
        </div>
        <div>
          <label className="block text-label">Status</label>
          <select
            name="status"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
            defaultValue="idea"
            required
          >
            <option value="" disabled>
              Select status
            </option>
            <option value="idea">Idea</option>
            <option value="pre-app">Pre-app</option>
            <option value="submitted">Submitted</option>
            <option value="consented">Consented</option>
            <option value="refused">Refused</option>
          </select>
        </div>
        <div>
          <label className="block text-label">Asking price</label>
          <input
            type="number"
            name="asking_price"
            min={0}
            step={1000}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
            placeholder="350000"
          />
        </div>
      </div>

      <div>
        <label className="block text-label">Proposed units</label>
        <input
          type="number"
          name="proposed_units"
          min={1}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
          placeholder="12"
        />
        <p className="mt-1 text-body text-zinc-600">
          Best for 3–40 homes in England; above that, treat outputs as indicative only.
        </p>
      </div>

      <div>
        <label className="block text-label">Initial notes / planning summary</label>
        <textarea
          name="notes"
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-body"
          placeholder="High-level thoughts, constraints, comparable schemes…"
        />
      </div>

      <div className="pt-2 flex items-center gap-3">
        <SubmitButton />
        <a
          href="/sites"
          className="text-label underline underline-offset-4"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
