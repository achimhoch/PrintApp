using System;
using System.Data.Common;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Windows.Storage;
using Windows.UI.Xaml.Controls;

namespace Tasks;

internal static  class LocalExchange
{


    private static string ExchangeDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "DruckServer",
        "PrintExchange"
    );

    public static async Task ExportTargetFileAsync(StorageFile targetFile, string? jobTitle)
    {
        Directory.CreateDirectory(ExchangeDirectory);

        var id = Guid.NewGuid().ToString("N");
        var pdfPath = Path.Combine(ExchangeDirectory, $"{id}.pdf");
        var jsonPath = Path.Combine(ExchangeDirectory, $"{id}.json");

        await targetFile.CopyAsync(
            await StorageFolder.GetFolderFromPathAsync(ExchangeDirectory),
            $"{id}.pdf",
            NameCollisionOption.ReplaceExisting
        );

        var metadata = new
        {
            id,
            filename = string.IsNullOrWhiteSpace(jobTitle)
            ? "print-job.pdf"
            : jobTitle.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)
                ? jobTitle
                : jobTitle + ".pdf",
            mime = "application/pdf",
            createdAt = DateTimeOffset.UtcNow,
            file = pdfPath
        };

        await File.WriteAllTextAsync(
            jsonPath, 
            JsonSerializer.Serialize(metadata,
            new JsonSerializerOptions { WriteIndented = true }
        ));
    }

    public static Task WriteErrorAsync(Exception ex)
    {
        Directory.CreateDirectory(ExchangeDirectory);

        var path = Path.Combine(ExchangeDirectory, "last-error-log");

        return File.WriteAllTextAsync(path, $"{DateTimeOffset.UtcNow:O}\r\n{ex}");
    }
}
