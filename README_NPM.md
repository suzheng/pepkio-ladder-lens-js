# Pepkio Ladder Lens

TypeScript and Node.js client library with CLI for estimating DNA, RNA, and protein gel electrophoresis band sizes via calibrated semi-log regression curves and the Pepkio Tools API.

# What It Does

In gel electrophoresis, estimating unknown DNA, RNA, or protein band sizes requires measuring migration distances against reference molecular weight markers. Manual interpolation from gel images is subjective, labor-intensive, and fails to correct for non-uniform electrophoretic mobility ("gel smiling") across lanes.

This package provides a typed Node.js/ESM client and command-line interface to submit band mobility measurements to the Pepkio Tools API. It calculates relative mobility ($R_f$), fits semi-log linear or 2nd-order polynomial calibration curves, performs dual-ladder gel smile correction, and returns estimated sample sizes alongside $R^2$ goodness-of-fit metrics and publication-ready methods text.

Programmatic runs require an active network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools REST API.

# Features

- **Semi-Log Regression Modeling**: Fits logarithmic molecular weight ($\log_{10}(\text{size})$) against relative mobility ($R_f$) using linear or 2nd-order polynomial models
- **Dual-Ladder Gel Smile Correction**: Interpolates migration curves across left and right reference lanes to compensate for thermal gradients and edge-effect curvature
- **Automated Relative Mobility ($R_f$) Calculation**: Converts pixel migration coordinates ($y_{\text{well}}$, $y_{\text{front}}$, $y_{\text{band}}$) into normalized mobility values
- **Goodness-of-Fit Diagnostics**: Reports $R^2$ coefficients, residual metrics, and boundary extrapolation warnings
- **Flexible Unit Support**: Estimates nucleic acid fragment length (bp, kb) and protein molecular mass (kDa)
- **Automated Methods Text**: Generates standardized scientific methodology prose for lab notebooks and publications
- **Manifest and Example Inspection**: Typed helper methods `getManifest`, `listExamples`, and `getExampleInput`
- **Command-Line Interface (CLI)**: Inspect manifests and execute band size estimations directly via `npx pepkio-ladder-lens`
- **TypeScript & ESM Native**: Fully typed with runtime validation via Zod

# Installation

```bash
npm install pepkio-ladder-lens
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before calling `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create an API key in your [Pepkio account settings](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (for remote API calls) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-ladder-lens";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// Retrieve a pre-configured 1 kb DNA ladder input example from the API manifest
const input = await client.getExampleInput("neb_1kb_single_ladder");
const response = await client.run(input);

if (response.result) {
  console.log(`Fit R²: ${response.result.fit.r_squared}`);
  for (const sample of response.result.samples) {
    console.log(`${sample.label}: ${sample.estimated_size_display}`);
  }
  console.log("\nMethods text:\n", response.result.methods_text);
}
```

# CLI

```bash
# Inspect available manifest examples
npx pepkio-ladder-lens manifest --examples

# Run a pre-configured manifest example
npx pepkio-ladder-lens run --example neb_1kb_single_ladder

# Run with dual ladder smile compensation
npx pepkio-ladder-lens run --example dual_ladder_smile
```

# Typical Use Cases

- **PCR Amplicon Verification**: Confirm expected amplicon lengths against 100 bp or 1 kb DNA ladders on agarose gels
- **Restriction Digest Analysis**: Determine DNA fragment sizes following single or double restriction endonuclease cleavage
- **SDS-PAGE Protein Sizing**: Estimate target protein molecular mass in kilodaltons (kDa) against standard protein ladders
- **Gel Smile Compensation**: Correct non-linear migration curvature across multi-lane gels using dual reference ladders
- **QC for Sequencing Libraries**: Validate fragment size distributions in LIMS, automated image processing, and notebook pipelines

# Scientific Background

Electrophoretic mobility of linear biomolecules through porous gel matrices scales inversely with the logarithm of molecular mass or sequence length. Relative mobility ($R_f$) normalizes band migration between the well origin ($y_{\text{well}}$) and the dye front ($y_{\text{front}}$):

$$R_f = \frac{y_{\text{band}} - y_{\text{well}}}{y_{\text{front}} - y_{\text{well}}}$$

The engine fits standard ladder bands using either a semi-log linear model ($\log_{10}(\text{size}) = m \cdot R_f + b$) or a 2nd-order polynomial model ($\log_{10}(\text{size}) = a \cdot R_f^2 + b \cdot R_f + c$). When dual reference ladders are provided, $R_f$ standard curves are interpolated across lane positions to correct for thermal and electric field gradients across the gel.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/ladder-lens

The web application provides interactive lane and band picking directly on uploaded gel images, standard curve visualization, dual-ladder gel smile compensation plots, shareable run links, and downloadable PDF/CSV reports.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-ladder-lens-js

Web Application: https://www.pepkio.com/tools/ladder-lens

Python client (PyPI): https://pypi.org/project/pepkio-ladder-lens/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/9329f60337fe3c65916bce71848be304e9b834667b8dd5ef2bdd54c87043cb7e)
