import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Génère un PDF à partir d'un élément HTML (WYSIWYG)
 * @param elementId L'ID de l'élément HTML à capturer
 * @param fileName Le nom du fichier PDF à télécharger
 */
export const generatePDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Capture l'élément en canvas haute résolution
    const canvas = await html2canvas(element, {
      scale: 2, // Améliore la qualité (Retina)
      useCORS: true, // Permet de charger les images externes (logos)
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Force le fond blanc et le texte noir pour éviter les problèmes de mode sombre
          clonedElement.style.backgroundColor = "#ffffff";
          clonedElement.style.color = "#000000";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png");

    // Dimensions du canvas en pixels
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // Conversion pixels -> mm (approx 1px = 0.264583 mm)
    // Mais on veut surtout que ça rentre dans le PDF.

    // Pour un ticket de caisse (80mm de large)
    // On fixe la largeur du PDF à 80mm
    const pdfWidth = 80;
    // On calcule la hauteur proportionnellement
    const pdfHeight = (imgHeightPx * pdfWidth) / imgWidthPx;

    // Création du PDF avec les dimensions exactes du contenu
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    // Ajout de l'image
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Téléchargement
    pdf.save(fileName);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF :", error);
    throw error;
  }
};
