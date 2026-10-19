import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { ReadMore } from "@/components/ReadMore";
import { DocShell } from "@/components/DocShell";

type Rate = { count: number; n: number; rate: number | null; wilson95: [number, number] };

type Ablation = {
  name: string;
  mode: string;
  lateral: boolean;
  note?: string;
  battery_research_flag_sensitivity: Rate;
  coin_pattern_rate: Rate;
  stacked_research_flag_rate: Rate;
};

type EvalReport = {
  disclaimer: string;
  definitions: Record<string, string>;
  dataset: {
    holdout_n_per_class: number;
    shift_n_per_class: number;
    holdout_description: string;
    shift_description: string;
    pairing: string;
    leakage: string;
    real_radiographs: string;
  };
  holdout_ensemble: {
    battery_research_flag_sensitivity: Rate;
    coin_pattern_rate: Rate;
    stacked_research_flag_rate: Rate;
    normal_false_research_flag_rate: Rate;
    battery_flag_vs_coin_and_normal: {
      tp: number;
      fp: number;
      fn: number;
      tn: number;
      precision: number;
      recall: number;
      specificity: number;
      f1: number;
      note: string;
    };
    confusion: { true_labels: string[]; predicted_buckets: string[]; matrix: number[][] };
    failures: { failure: string; label: string; index: number; prediction: string }[];
  };
  shifted_ensemble: {
    battery_research_flag_sensitivity: Rate;
    coin_pattern_rate: Rate;
    stacked_research_flag_rate: Rate;
  };
  ablations: Ablation[];
  latency_ms: { explain_false_p50: number; explain_false_p95: number; explain_true_one_sample: number | null; device: string };
  provenance: { evaluated_at: string; git_commit: string; weights_sha256: string; platform: string };
};

function loadReport(): EvalReport | null {
  const p = path.join(process.cwd(), "public/figures/validation/eval_report.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as EvalReport;
}

function pct(rate: Rate | undefined): string {
  if (!rate || rate.rate == null) return "—";
  const [lo, hi] = rate.wilson95;
  return `${(rate.rate * 100).toFixed(1)}% (${rate.count}/${rate.n}; Wilson 95% ${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)})`;
}

export default function ValidationPage() {
  const report = loadReport();

  return (
    <DocShell current="validation">
      <h1>Evaluation</h1>
      <p className="lede">
        Synthetic measurements of the shipped checkpoint. These are not clinical accuracy and they are not a
        comparison that shows HaloScan beating the Emory 2020 radiograph study.
      </p>
      <p className="muted">
        DualViewNet alone still calls every synthetic coin battery-like when an independently drawn lateral is
        attached (<code>cnn_only</code> coin-pattern rate 0/40). The default ensemble applies a dual-view
        collapse guard, so AP+lateral ensemble coin-pattern recovers to 40/40 on the 2026-10-12 holdout.
      </p>

      <aside className="callout" role="note" aria-label="Limitations">
        <h2>Read this first: limitations</h2>
        <p>
          Every number on this page measures synthetic pattern recognition on drawn images. None of it is medical
          detection performance, and none of it was measured on real radiographs.
        </p>
        <ul>
          <li>
            <strong>Shifted generator, coins:</strong> when the image generator is changed (smaller frame, edge
            placement, heavy JPEG, noise), only 5 of 40 synthetic coins (12.5%) are still recognized as coin-like.
            The rest are called battery-like or ambiguous. Results do not transfer well to images that look
            different from training.
          </li>
          <li>
            <strong>Stacked coins:</strong> the confusion table shows stacked coins are usually labeled battery-like
            or ambiguous, never &quot;stacked coins&quot;. Training merged stacks into the battery class, so the
            app can only raise a flag on them, not recognize them.
          </li>
          <li>
            <strong>Normal images:</strong> images with no object are almost always called coin-like (39 of 40 on
            the holdout). A coin-like output does not mean a coin is present.
          </li>
          <li>
            <strong>Battery flag 40/40:</strong> this shows the app flags ring patterns readily, including on many
            non-batteries (on the shifted set, 52 coin or normal images were also flagged). It is not an
            accuracy claim. The Wilson 95% interval for 40/40 starts near 91%.
          </li>
        </ul>
      </aside>

      {!report ? (
        <p>
          The versioned report has not been generated yet. From the repository root:{" "}
          <code>python3 -m haloscan.eval_suite --n 40</code>
        </p>
      ) : (
        <>
          <p>{report.disclaimer}</p>
          <p className="muted">
            Evaluated {report.provenance.evaluated_at}. Commit {report.provenance.git_commit.slice(0, 12)}. Weights
            SHA-256 {report.provenance.weights_sha256.slice(0, 16)}… Device {report.latency_ms.device},{" "}
            {report.provenance.platform}.
          </p>

          <table className="data">
            <thead>
              <tr>
                <th>Synthetic measure</th>
                <th>In-distribution holdout</th>
                <th>Shifted generator</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Battery research-flag rate</td>
                <td>{pct(report.holdout_ensemble.battery_research_flag_sensitivity)}</td>
                <td>{pct(report.shifted_ensemble.battery_research_flag_sensitivity)}</td>
              </tr>
              <tr>
                <td>Coin-like pattern rate</td>
                <td>{pct(report.holdout_ensemble.coin_pattern_rate)}</td>
                <td>{pct(report.shifted_ensemble.coin_pattern_rate)}</td>
              </tr>
              <tr>
                <td>Stacked-coin research-flag rate</td>
                <td>{pct(report.holdout_ensemble.stacked_research_flag_rate)}</td>
                <td>{pct(report.shifted_ensemble.stacked_research_flag_rate)}</td>
              </tr>
              <tr>
                <td>Normal images flagged</td>
                <td>{pct(report.holdout_ensemble.normal_false_research_flag_rate)}</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>

          <ReadMore title="Battery flag versus coin and normal">
            <p>{report.holdout_ensemble.battery_flag_vs_coin_and_normal.note}</p>
            <table className="data">
              <tbody>
                <tr>
                  <td>Precision</td>
                  <td>{report.holdout_ensemble.battery_flag_vs_coin_and_normal.precision}</td>
                </tr>
                <tr>
                  <td>Recall</td>
                  <td>{report.holdout_ensemble.battery_flag_vs_coin_and_normal.recall}</td>
                </tr>
                <tr>
                  <td>Specificity</td>
                  <td>{report.holdout_ensemble.battery_flag_vs_coin_and_normal.specificity}</td>
                </tr>
                <tr>
                  <td>F1</td>
                  <td>{report.holdout_ensemble.battery_flag_vs_coin_and_normal.f1}</td>
                </tr>
                <tr>
                  <td>TP / FP / FN / TN</td>
                  <td>
                    {report.holdout_ensemble.battery_flag_vs_coin_and_normal.tp} /{" "}
                    {report.holdout_ensemble.battery_flag_vs_coin_and_normal.fp} /{" "}
                    {report.holdout_ensemble.battery_flag_vs_coin_and_normal.fn} /{" "}
                    {report.holdout_ensemble.battery_flag_vs_coin_and_normal.tn}
                  </td>
                </tr>
              </tbody>
            </table>
          </ReadMore>

          <ReadMore title="Confusion, same holdout">
            <table className="data">
              <thead>
                <tr>
                  <th>True \ called</th>
                  {report.holdout_ensemble.confusion.predicted_buckets.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.holdout_ensemble.confusion.true_labels.map((label, i) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {report.holdout_ensemble.confusion.matrix[i].map((value, j) => (
                      <td key={j}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ReadMore>

          <ReadMore title="Ablations on the same holdout seeds">
            <table className="data">
              <thead>
                <tr>
                  <th>Configuration</th>
                  <th>Battery flag</th>
                  <th>Coin pattern</th>
                  <th>Stack flagged</th>
                </tr>
              </thead>
              <tbody>
                {report.ablations.map((row) => (
                  <tr key={row.name}>
                    <td>
                      {row.name}
                      {row.note ? ` — ${row.note}` : ""}
                    </td>
                    <td>{pct(row.battery_research_flag_sensitivity)}</td>
                    <td>{pct(row.coin_pattern_rate)}</td>
                    <td>{pct(row.stacked_research_flag_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Image
              src="/figures/validation/ablation.png"
              alt="Ablation rates on the synthetic holdout"
              width={900}
              height={420}
              className="figure-img"
              unoptimized
            />
          </ReadMore>

          <ReadMore title="Failures and latency">
            {report.holdout_ensemble.failures.length === 0 ? (
              <p>No holdout rows matched the failure rules in this run. That is not evidence of clinical safety.</p>
            ) : (
              <ul className="plain-list">
                {report.holdout_ensemble.failures.map((row) => (
                  <li key={`${row.failure}-${row.label}-${row.index}`}>
                    {row.failure}: {row.label} #{row.index} called {row.prediction}
                  </li>
                ))}
              </ul>
            )}
            <p>
              CPU latency without Grad-CAM: p50 {report.latency_ms.explain_false_p50} ms, p95{" "}
              {report.latency_ms.explain_false_p95} ms. One sample with Grad-CAM:{" "}
              {report.latency_ms.explain_true_one_sample ?? "not measured"} ms.
            </p>
          </ReadMore>

          <ReadMore title="How the images are made">
            <p>{report.dataset.holdout_description}</p>
            <p>{report.dataset.shift_description}</p>
            <p>{report.dataset.pairing}</p>
            <p>{report.dataset.leakage}</p>
            <p>{report.dataset.real_radiographs}</p>
            <p>{report.definitions.training_label_collapse}</p>
          </ReadMore>
        </>
      )}

      <p>
        Reproduce with <code>python3 -m haloscan.eval_suite --n 40</code>. The command writes{" "}
        <code>docs/eval/eval_report.json</code> and the chart on this page.
      </p>
      <p>
        <Link href="/scan?judge=1">Open the judge demo</Link>
      </p>
    </DocShell>
  );
}
