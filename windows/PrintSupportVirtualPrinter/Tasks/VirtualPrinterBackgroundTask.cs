using System;
using System.IO;
using Windows.ApplicationModel.Background;
using Windows.Devices.Printers;
using Windows.Graphics.Printing.Workflow;
using Windows.Storage;
using Windows.Storage.Streams;

namespace Tasks;

public sealed class VirtualPrinterBackgroundTask : IBackgroundTask
{
    private BackgroundTaskDeferral? _deferral;

    public void Run(IBackgroundTaskInstance taskInstance)
    {
        _deferral = taskInstance.GetDeferral();

        if (taskInstance.TriggerDetails is not PrintWorkflowVirtualPrinterTriggerDetails details)
        {
            _deferral.Complete();
            return;
        }

        var session = details.VirtualPrinterSession;
        session.VirtualPrinterDataAvailable += OnVirtualPrinterDataAvailable;
        session.Start();
    }

    public async void OnVirtualPrinterDataAvailable(PrintWorkflowVirtualPrinterSession sender, PrintWorkflowVirtualPrinterDataAvailableEventArgs args)
    {
        var status = PrintWorkflowSubmittedStatus.Failed;

        try
        {
            var source = args.SourceContent;
            var targetFile = await args.GetTargetFileAsync();

            if (targetFile is null)
            {
                throw new InvalidOperationException("Windows did not provide a target file");
            }

            if (!string.Equals(targetFile.FileType, ".pdf", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Unexpected target file type: {targetFile.FileType}");

            }

            var input = source.GetInputStream();
            var target = await targetFile.OpenAsync(FileAccessMode.ReadWrite);

            try
            {
                
            }

            finally
            {
                
            }
        }
        catch (Exception ex)
        {
            
        }
        finally
        {
            
        }
    }
}