import { NodePath } from 'ast-types'
import buildParser from '../../babel-parser'
import Documentation, { SlotDescriptor } from '../../Documentation'
import resolveExportedComponent from '../../utils/resolveExportedComponent'
import functionalSlotHandler from '../functionalSlotHandler'

jest.mock('../../Documentation')

function parse(src: string): NodePath | undefined {
	const ast = buildParser({ plugins: ['jsx'] }).parse(src)
	return resolveExportedComponent(ast)[0].get('default')
}

describe('functional render function slotHandler', () => {
	let documentation: Documentation
	let mockSlotDescriptor: SlotDescriptor

	beforeEach(() => {
		mockSlotDescriptor = { name: 'default', description: '' }
		documentation = new Documentation('dummy/path')
		const mockGetSlotDescriptor = documentation.getSlotDescriptor as jest.Mock
		mockGetSlotDescriptor.mockReturnValue(mockSlotDescriptor)
	})

	it('should find slots in functional render function', async done => {
		const src = `
    export default {
	  functional: true,
      render: function (createElement, ctx) {
		/* @slot describe default slot */
        return createElement('div', ctx.data, ctx.children)
      }
    }
    `
		const def = parse(src)
		if (def) {
			await functionalSlotHandler(documentation, def)
		}
		expect(documentation.getSlotDescriptor).toHaveBeenCalledWith('default')
		expect(mockSlotDescriptor.description).toBe('describe default slot')
		done()
	})

	it('should parse functional components without context', async done => {
		const src = `
    export default {
	  functional: true,
      render: function (createElement) {
        return createElement('div', {}, 'hello world')
      }
    }
    `
		const def = parse(src)
		if (def) {
			expect(async () => {
				await functionalSlotHandler(documentation, def)
				done()
			}).not.toThrow()
		} else {
			done.fail()
		}
	})
})