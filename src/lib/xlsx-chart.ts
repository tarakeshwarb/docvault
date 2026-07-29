/**
 * Injects native (editable) Excel bar charts into an ExcelJS-generated .xlsx.
 *
 * ExcelJS cannot author charts, so we post-process the produced workbook (a zip)
 * and add the OOXML chart parts by hand — one clustered-column chart per sheet,
 * bound to that sheet's range-of-marks table (categories H11:H16, values I11:I16).
 * Uses JSZip, which is already a project dependency (no new packages).
 */
import JSZip from "jszip";

export type ChartSpec = {
  /** 1-based index matching xl/worksheets/sheet{n}.xml (worksheet creation order). */
  sheetIndex: number;
  /** The worksheet's display name, used in the chart's cell references. */
  sheetName: string;
  /** Category cells (range labels). Default "$H$11:$H$16". */
  catRange?: string;
  /** Value cells (counts). Default "$I$11:$I$16". */
  valRange?: string;
  /** Cell holding the series title. Default "$I$10". */
  titleCell?: string;
  /** Chart title text. */
  title?: string;
  /** Anchor: [fromCol, fromRow, toCol, toRow] (0-based). Default [1,17,9,39]. */
  anchor?: [number, number, number, number];
};

const BAR_COLOR = "2F6FB0";
const CAT_AXIS_ID = "111111111";
const VAL_AXIS_ID = "222222222";

function quoteSheet(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

function chartXml(spec: ChartSpec): string {
  const ref = quoteSheet(spec.sheetName);
  const catRange = spec.catRange ?? "$H$11:$H$16";
  const valRange = spec.valRange ?? "$I$11:$I$16";
  const titleCell = spec.titleCell ?? "$I$10";
  const title = spec.title ?? "Total vs. Range of Marks";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr b="1" sz="1100"/></a:pPr><a:r><a:rPr lang="en-US" b="1" sz="1100"/><a:t>${title}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/>
<c:plotArea>
<c:layout/>
<c:barChart>
<c:barDir val="col"/>
<c:grouping val="clustered"/>
<c:varyColors val="0"/>
<c:ser>
<c:idx val="0"/>
<c:order val="0"/>
<c:tx><c:strRef><c:f>${ref}!${titleCell}</c:f></c:strRef></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="${BAR_COLOR}"/></a:solidFill></c:spPr>
<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>
<c:cat><c:strRef><c:f>${ref}!${catRange}</c:f></c:strRef></c:cat>
<c:val><c:numRef><c:f>${ref}!${valRange}</c:f></c:numRef></c:val>
</c:ser>
<c:gapWidth val="60"/>
<c:axId val="${CAT_AXIS_ID}"/>
<c:axId val="${VAL_AXIS_ID}"/>
</c:barChart>
<c:catAx>
<c:axId val="${CAT_AXIS_ID}"/>
<c:scaling><c:orientation val="minMax"/></c:scaling>
<c:delete val="0"/>
<c:axPos val="b"/>
<c:crossAx val="${VAL_AXIS_ID}"/>
</c:catAx>
<c:valAx>
<c:axId val="${VAL_AXIS_ID}"/>
<c:scaling><c:orientation val="minMax"/></c:scaling>
<c:delete val="0"/>
<c:axPos val="l"/>
<c:majorGridlines/>
<c:crossAx val="${CAT_AXIS_ID}"/>
</c:valAx>
</c:plotArea>
<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>
<c:plotVisOnly val="1"/>
<c:dispBlanksAs val="gap"/>
</c:chart>
</c:chartSpace>`;
}

function drawingXml(anchor?: [number, number, number, number]): string {
  const [fc, fr, tc, tr] = anchor ?? [1, 17, 9, 39];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<xdr:twoCellAnchor>
<xdr:from><xdr:col>${fc}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${fr}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${tc}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${tr}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro="">
<xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic>
</xdr:graphicFrame>
<xdr:clientData/>
</xdr:twoCellAnchor>
</xdr:wsDr>`;
}

function drawingRels(chartIndex: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${chartIndex}.xml"/>
</Relationships>`;
}

function sheetRels(drawingIndex: number): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdChart" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingIndex}.xml"/>
</Relationships>`;
}

export async function injectBarCharts(xlsxBuffer: Buffer, specs: ChartSpec[]): Promise<Buffer> {
  const zip = await JSZip.loadAsync(xlsxBuffer);
  const ctPath = "[Content_Types].xml";
  const ctFile = zip.file(ctPath);
  if (!ctFile) return xlsxBuffer; // nothing we can safely do
  let ct = await ctFile.async("string");
  const overrides: string[] = [];

  for (const spec of specs) {
    const n = spec.sheetIndex;
    const sheetPath = `xl/worksheets/sheet${n}.xml`;
    const sheetFile = zip.file(sheetPath);
    if (!sheetFile) continue;

    zip.file(`xl/charts/chart${n}.xml`, chartXml(spec));
    zip.file(`xl/drawings/drawing${n}.xml`, drawingXml(spec.anchor));
    zip.file(`xl/drawings/_rels/drawing${n}.xml.rels`, drawingRels(n));
    zip.file(`xl/worksheets/_rels/sheet${n}.xml.rels`, sheetRels(n));

    const sheetXml = await sheetFile.async("string");
    if (!sheetXml.includes("<drawing ")) {
      zip.file(sheetPath, sheetXml.replace("</worksheet>", '<drawing r:id="rIdChart"/></worksheet>'));
    }

    overrides.push(
      `<Override PartName="/xl/drawings/drawing${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`,
      `<Override PartName="/xl/charts/chart${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
    );
  }

  ct = ct.replace("</Types>", `${overrides.join("")}</Types>`);
  zip.file(ctPath, ct);

  const out = await zip.generateAsync({ type: "nodebuffer" });
  return out;
}
