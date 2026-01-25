from fpdf import FPDF
import os
from datetime import datetime

class PDFInvoice(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'StockIn - Factura de Venta', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

def generar_pdf_factura(factura, output_path=None):
    pdf = PDFInvoice()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Info Empresa (Placeholder)
    pdf.cell(0, 5, "Taller y Repuestos StockIn", 0, 1)
    pdf.cell(0, 5, "RUC: 0000000000001", 0, 1)
    pdf.cell(0, 5, "Direccion: Av. Principal 123", 0, 1)
    pdf.ln(5)

    # Info Factura
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(100, 10, f"Factura Nro: {factura.nro_factura}", 0, 0)
    pdf.cell(0, 10, f"Fecha: {factura.fecha_emision.strftime('%Y-%m-%d %H:%M')}", 0, 1)
    
    # Info Cliente
    pdf.set_font("Arial", size=12)
    cliente = factura.cliente
    pdf.cell(0, 5, f"Cliente: {cliente.nombre}", 0, 1)
    pdf.cell(0, 5, f"RUC/CI: {cliente.cedula}", 0, 1)
    pdf.cell(0, 5, f"Direccion: {cliente.direccion or 'N/A'}", 0, 1)
    pdf.cell(0, 5, f"Telefono: {cliente.telefono or 'N/A'}", 0, 1)
    pdf.ln(10)

    # Tabla Header
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(80, 8, "Descripcion", 1)
    pdf.cell(30, 8, "Cant", 1, 0, 'C')
    pdf.cell(40, 8, "P. Unit", 1, 0, 'R')
    pdf.cell(40, 8, "Subtotal", 1, 1, 'R')

    # Detalles
    pdf.set_font("Arial", size=10)
    
    detalles = []
    # Dependiendo de si es Venta Directa u Orden de Trabajo
    if factura.venta:
        detalles = factura.venta.detalles
        for d in detalles:
            nombre = d.producto.nombre if d.producto else "Producto Eliminado"
            subtotal = d.cantidad * (d.producto.precio if d.producto else 0)
            pdf.cell(80, 8, f"{nombre[:35]}", 1)
            pdf.cell(30, 8, str(d.cantidad), 1, 0, 'C')
            pdf.cell(40, 8, f"{d.producto.precio:.2f}", 1, 0, 'R')
            pdf.cell(40, 8, f"{subtotal:.2f}", 1, 1, 'R')
    elif factura.orden:
        # TODO: Handle OT Details logic if different
        pass

    # Totales
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(110, 10, "", 0, 0)
    pdf.cell(40, 10, "Total Final:", 0, 0, 'R')
    pdf.cell(40, 10, f"${factura.total_final:.2f}", 0, 1, 'R')

    if not output_path:
        # Save to temp
        filename = f"factura_{factura.nro_factura}.pdf"
        output_path = os.path.join("static", "invoices", filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    pdf.output(output_path)
    return output_path
