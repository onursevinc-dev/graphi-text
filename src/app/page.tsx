import CanvasDrawing from "@/components/CanvasDrawing";
import PdfViewer from "@/components/PdfViewer";

export default function Home() {
  return (
      <main className="flex min-h-screen flex-col items-center justify-between">
          <CanvasDrawing />
          {/*<div>*/}
          {/*    <h1>PDF Viewer</h1>*/}
          {/*    <PdfViewer/>*/}
          {/*</div>*/}
      </main>
  );
}