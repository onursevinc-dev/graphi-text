import OtherPdfCanvas from "@/components/OtherPdfCanvas";
import CanvasDrawing from "@/components/CanvasDrawing";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            {/*<OtherPdfCanvas/>*/}
            <CanvasDrawing />
            {/*<div>*/}
            {/*    <h1>PDF Viewer</h1>*/}
            {/*    <PdfViewer/>*/}
            {/*</div>*/}
        </main>
    );
}